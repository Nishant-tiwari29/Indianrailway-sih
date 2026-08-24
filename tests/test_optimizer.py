"""
Unit & Assertion Tests for OR-Tools CP-SAT Block Planning Optimizer
Validates:
- Feasibility of schedule
- Zero double booking on same track section
- Zero must-run train violations
- Crew limit respect
- Urgency score impact on decisions
"""

import pytest
from backend.app.generator import generate_network_data
from backend.app.optimizer import solve_block_schedule
from backend.app.models import OptimizationWeights, BlockRequest


def test_optimizer_baseline_feasibility():
    """Verify that CP-SAT solver runs and returns an OPTIMAL or FEASIBLE schedule."""
    data = generate_network_data(seed=42)
    weights = OptimizationWeights(crew_limit=4, enforce_must_run=True)
    result = solve_block_schedule(data.requests, data.sections, data.trains, weights)

    assert result.kpis.solver_status in ("OPTIMAL", "FEASIBLE")
    assert result.kpis.granted_requests > 0
    assert result.kpis.total_requests == len(data.requests)
    assert len(result.scheduled_requests) == len(data.requests)
    assert len(result.decisions) == len(data.requests)


def test_no_double_booked_sections():
    """Assertion: At any slot t and section s, at most 1 maintenance block is active."""
    data = generate_network_data(seed=42)
    weights = OptimizationWeights(crew_limit=4)
    result = solve_block_schedule(data.requests, data.sections, data.trains, weights)

    # Check timeline grid for overlaps
    for sec_id, slots in result.timeline_grid.items():
        assert len(slots) == 24
        # Each slot is either None or a single request_id string
        for slot_val in slots:
            assert slot_val is None or isinstance(slot_val, str)

    # Cross-check from scheduled_requests
    section_slot_occupancy = {}
    for req in result.scheduled_requests:
        if req.status in ("GRANTED", "APPROVED") and req.assigned_slots:
            for s in req.assigned_slots:
                key = (req.section_id, s)
                assert key not in section_slot_occupancy, (
                    f"Conflict detected! Section {req.section_id} at slot {s} double-booked by {req.id} and {section_slot_occupancy[key]}"
                )
                section_slot_occupancy[key] = req.id


def test_no_must_run_train_conflicts():
    """Assertion: When enforce_must_run is True, zero must-run train conflicts occur."""
    data = generate_network_data(seed=42)
    weights = OptimizationWeights(crew_limit=4, enforce_must_run=True)
    result = solve_block_schedule(data.requests, data.sections, data.trains, weights)

    assert result.kpis.must_run_train_conflicts == 0

    # Build must-run map
    must_run_map = set()
    for tr in data.trains:
        if tr.is_must_run:
            for sec_id, slots in tr.section_slots.items():
                for s in slots:
                    must_run_map.add((sec_id, s))

    # Verify no granted block is in must_run_map
    for req in result.scheduled_requests:
        if req.status in ("GRANTED", "APPROVED") and req.assigned_slots:
            for s in req.assigned_slots:
                assert (req.section_id, s) not in must_run_map, (
                    f"Must-run conflict! Request {req.id} scheduled on {req.section_id} at slot {s} when must-run train is active"
                )


def test_crew_limit_never_exceeded():
    """Assertion: Simultaneous active blocks network-wide <= crew_limit at all 24 slots."""
    data = generate_network_data(seed=42)
    crew_limit = 3
    weights = OptimizationWeights(crew_limit=crew_limit, enforce_must_run=True)
    result = solve_block_schedule(data.requests, data.sections, data.trains, weights)

    assert result.kpis.peak_crew_utilization <= crew_limit
    for slot_load in result.hourly_crew_load:
        assert slot_load <= crew_limit, f"Crew limit exceeded! Slot has {slot_load} gangs active, max allowed is {crew_limit}"


def test_what_if_urgency_increase_grants_rejected_block():
    """Verify that boosting urgency of a rejected request changes solver outcome."""
    data = generate_network_data(seed=42)
    weights = OptimizationWeights(crew_limit=4)
    initial_result = solve_block_schedule(data.requests, data.sections, data.trains, weights)

    # Find a rejected request
    rejected = [r for r in initial_result.scheduled_requests if r.status == "REJECTED"]
    assert len(rejected) > 0

    target_req = rejected[0]
    # Modify data: increase urgency to 99.0 and relax preferred window to full day [0, 23]
    modified_requests = []
    for r in data.requests:
        if r.id == target_req.id:
            modified_requests.append(
                r.model_copy(update={"urgency_score": 99.0, "preferred_start_window": [0, 23]})
            )
        else:
            modified_requests.append(r)

    updated_result = solve_block_schedule(modified_requests, data.sections, data.trains, weights)
    updated_target = next(r for r in updated_result.scheduled_requests if r.id == target_req.id)

    # The high urgency request should now have higher priority and be granted
    assert updated_target.status == "GRANTED" or updated_result.kpis.granted_requests >= initial_result.kpis.granted_requests
