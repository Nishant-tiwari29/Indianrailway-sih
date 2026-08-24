"""
Google OR-Tools CP-SAT Optimization Engine for Indian Railways Block Planning
Solves multi-objective track maintenance scheduling balancing safety risk vs traffic disruption.
"""

import time
from typing import List, Dict, Tuple, Optional, Any
from ortools.sat.python import cp_model
from .models import (
    BlockRequest,
    TrackSection,
    Train,
    OptimizationWeights,
    OptimizationResult,
    KPISummary,
    DecisionReason
)
from .explainability import generate_decision_explanations


def solve_block_schedule(
    requests: List[BlockRequest],
    sections: List[TrackSection],
    trains: List[Train],
    weights: Optional[OptimizationWeights] = None
) -> OptimizationResult:
    """
    Run CP-SAT solver to determine optimal block allocation.
    Returns full schedule, KPI analytics, and per-decision explainability logs.
    """
    start_time = time.perf_counter()
    if weights is None:
        weights = OptimizationWeights()

    model = cp_model.CpModel()
    num_slots = 24  # 24 hourly time buckets: 00:00 to 23:00

    sec_dict = {s.section_id: s for s in sections}

    # 1. Precompute must-run flags and traffic disruption profiles per (section, slot)
    must_run_flags: Dict[Tuple[str, int], bool] = {}
    passenger_counts: Dict[Tuple[str, int], int] = {}
    freight_counts: Dict[Tuple[str, int], int] = {}

    for s in sections:
        for t in range(num_slots):
            must_run_flags[(s.section_id, t)] = False
            passenger_counts[(s.section_id, t)] = 0
            freight_counts[(s.section_id, t)] = 0

    for tr in trains:
        for sec_id, slots in tr.section_slots.items():
            for slot in slots:
                if 0 <= slot < num_slots:
                    if tr.is_must_run:
                        must_run_flags[(sec_id, slot)] = True
                    elif tr.priority == 2:
                        passenger_counts[(sec_id, slot)] += 1
                    else:
                        freight_counts[(sec_id, slot)] += 1

    # Disruption cost function per section & slot
    def get_slot_disruption_cost(sec_id: str, slot: int) -> int:
        sec = sec_dict.get(sec_id)
        density = sec.hourly_traffic_density[slot] if sec and slot < len(sec.hourly_traffic_density) else 2.0
        pax = passenger_counts.get((sec_id, slot), 0)
        frt = freight_counts.get((sec_id, slot), 0)
        # Scaled integer cost
        cost = int((pax * 45.0 + frt * 12.0 + density * 18.0) * 10)
        return max(5, cost)

    # 2. Define CP-SAT Decision Variables
    # g[r]: binary variable indicating if request r is granted
    # s[r, t]: binary variable indicating request r starts at slot t
    # u[r, t]: binary variable indicating request r occupies section at slot t
    g_vars: Dict[str, cp_model.IntVar] = {}
    start_vars: Dict[Tuple[str, int], cp_model.IntVar] = {}
    occupy_vars: Dict[Tuple[str, int], cp_model.IntVar] = {}

    for req in requests:
        r_id = req.id
        dur = req.duration_hours
        g_vars[r_id] = model.NewBoolVar(f"grant_{r_id}")

        valid_start_slots = range(0, max(1, num_slots - dur + 1))
        for t in valid_start_slots:
            start_vars[(r_id, t)] = model.NewBoolVar(f"start_{r_id}_{t}")

        # Link start slots to grant variable: sum(start_vars) == g_var
        model.Add(sum(start_vars[(r_id, t)] for t in valid_start_slots) == g_vars[r_id])

        # Occupancy variables for each hour t in 0..23
        for t in range(num_slots):
            occupy_vars[(r_id, t)] = model.NewBoolVar(f"occ_{r_id}_{t}")
            # u[r, t] is 1 if and only if request started at some tau where tau <= t < tau + dur
            covering_starts = [
                start_vars[(r_id, tau)]
                for tau in range(max(0, t - dur + 1), min(len(valid_start_slots), t + 1))
                if (r_id, tau) in start_vars
            ]
            if covering_starts:
                model.Add(occupy_vars[(r_id, t)] == sum(covering_starts))
            else:
                model.Add(occupy_vars[(r_id, t)] == 0)

    # 3. Hard Constraints

    # Constraint A: Section Exclusivity (No two maintenance blocks on same section simultaneously)
    for sec in sections:
        sec_reqs = [r for r in requests if r.section_id == sec.section_id]
        for t in range(num_slots):
            model.Add(sum(occupy_vars[(r.id, t)] for r in sec_reqs) <= 1)

    # Constraint B: Must-Run Train Protection (Zero overlap with premium must-run trains)
    if weights.enforce_must_run:
        for req in requests:
            for t in range(num_slots):
                if must_run_flags.get((req.section_id, t), False):
                    # Section is occupied by Must-Run train at slot t -> Block cannot occupy section
                    model.Add(occupy_vars[(req.id, t)] == 0)

    # Constraint C: Network-wide Crew / Machine Resource Cap
    for t in range(num_slots):
        model.Add(sum(occupy_vars[(r.id, t)] for r in requests) <= weights.crew_limit)

    # 4. Multi-Objective Function Terms
    objective_terms = []

    for req in requests:
        r_id = req.id
        dur = req.duration_hours
        sec = sec_dict.get(req.section_id)
        sec_risk = sec.risk_score if sec else 50.0

        # Term 1: Unaddressed Risk Penalty (incurred if request is NOT granted)
        # Higher urgency and higher section risk => much higher penalty if rejected
        composite_risk = (req.urgency_score * 1.6 + sec_risk * 0.9)
        risk_penalty = int(composite_risk * weights.weight_risk * 10)
        objective_terms.append((1 - g_vars[r_id]) * risk_penalty)

        # Term 2: Backlog Penalty (flat penalty for denying any block demand)
        backlog_penalty = int(weights.weight_backlog * 120)
        objective_terms.append((1 - g_vars[r_id]) * backlog_penalty)

        # Term 3: Traffic Disruption Cost for every occupied slot
        for t in range(num_slots):
            slot_cost = int(get_slot_disruption_cost(req.section_id, t) * weights.weight_disruption)
            objective_terms.append(occupy_vars[(r_id, t)] * slot_cost)

        # Term 4: Preferred Window Deviation Penalty
        win_start, win_end = req.preferred_start_window
        valid_start_slots = range(0, max(1, num_slots - dur + 1))
        for t in valid_start_slots:
            # Distance from preferred start window
            if t < win_start:
                dist = win_start - t
            elif t > win_end:
                dist = t - win_end
            else:
                dist = 0

            if dist > 0:
                dist_cost = int(dist * 18)
                objective_terms.append(start_vars[(r_id, t)] * dist_cost)

    model.Minimize(sum(objective_terms))

    # 5. Solve Model
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_search_workers = 4

    solve_status_code = solver.Solve(model)
    solve_duration_ms = (time.perf_counter() - start_time) * 1000.0

    status_str = "OPTIMAL" if solve_status_code == cp_model.OPTIMAL else (
        "FEASIBLE" if solve_status_code == cp_model.FEASIBLE else "INFEASIBLE"
    )

    # 6. Extract Schedule & Compute KPIs
    scheduled_requests: List[BlockRequest] = []
    section_slot_map: Dict[Tuple[str, int], str] = {}
    hourly_crew_load = [0] * num_slots
    timeline_grid: Dict[str, List[Optional[str]]] = {s.section_id: [None] * num_slots for s in sections}

    total_req_hours = sum(r.duration_hours for r in requests)
    total_granted_hours = 0
    initial_risk = sum(r.urgency_score for r in requests)
    remaining_risk = 0.0
    passenger_delay_mins = 0
    must_run_conflicts = 0

    for req in requests:
        r_copy = req.model_copy()
        is_granted = False

        if solve_status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            is_granted = bool(solver.Value(g_vars[req.id]) == 1)

        if is_granted:
            # Find assigned start slot
            dur = req.duration_hours
            valid_start_slots = range(0, max(1, num_slots - dur + 1))
            assigned_start = 0
            for t in valid_start_slots:
                if solver.Value(start_vars[(req.id, t)]) == 1:
                    assigned_start = t
                    break

            assigned_slots = list(range(assigned_start, assigned_start + dur))
            r_copy.status = "GRANTED"
            r_copy.assigned_start_slot = assigned_start
            r_copy.assigned_slots = assigned_slots
            total_granted_hours += dur

            for s in assigned_slots:
                if 0 <= s < num_slots:
                    hourly_crew_load[s] += 1
                    section_slot_map[(req.section_id, s)] = req.id
                    timeline_grid[req.section_id][s] = req.id

                    # Check must run conflict (should be 0)
                    if must_run_flags.get((req.section_id, s), False):
                        must_run_conflicts += 1

                    # Count standard passenger trains affected
                    pax_count = passenger_counts.get((req.section_id, s), 0)
                    passenger_delay_mins += (pax_count * 15)  # estimate 15 min regulation per train
        else:
            r_copy.status = "REJECTED"
            r_copy.assigned_start_slot = None
            r_copy.assigned_slots = None
            remaining_risk += req.urgency_score

        scheduled_requests.append(r_copy)

    # Calculate Summary KPIs
    total_req_count = len(requests)
    granted_count = sum(1 for r in scheduled_requests if r.status in ("GRANTED", "APPROVED"))
    rejected_count = total_req_count - granted_count
    grant_rate = (granted_count / max(1, total_req_count)) * 100.0
    productivity_pct = (total_granted_hours / max(1, len(sections) * num_slots)) * 100.0
    risk_mitigated_pct = ((initial_risk - remaining_risk) / max(1.0, initial_risk)) * 100.0
    peak_crew = max(hourly_crew_load) if hourly_crew_load else 0

    kpis = KPISummary(
        total_requests=total_req_count,
        granted_requests=granted_count,
        rejected_requests=rejected_count,
        grant_rate_pct=round(grant_rate, 1),
        total_requested_hours=total_req_hours,
        total_granted_hours=total_granted_hours,
        block_productivity_pct=round(productivity_pct, 1),
        initial_network_risk=round(initial_risk, 1),
        remaining_network_risk=round(remaining_risk, 1),
        risk_mitigated_pct=round(risk_mitigated_pct, 1),
        passenger_train_delay_minutes=passenger_delay_mins,
        must_run_train_conflicts=must_run_conflicts,
        peak_crew_utilization=peak_crew,
        max_crew_capacity=weights.crew_limit,
        solver_status=status_str,
        solve_time_ms=round(solve_duration_ms, 2)
    )

    # 7. Generate Explainability Decisions
    decisions = generate_decision_explanations(
        requests=scheduled_requests,
        sections=sections,
        trains=trains,
        weights=weights,
        hourly_crew_load=hourly_crew_load,
        section_slot_map=section_slot_map
    )

    # Attach short reason to each scheduled request
    dec_dict = {d.request_id: d.primary_reason for d in decisions}
    for r in scheduled_requests:
        r.reason = dec_dict.get(r.id, "Processed by CP-SAT solver")

    return OptimizationResult(
        kpis=kpis,
        scheduled_requests=scheduled_requests,
        decisions=decisions,
        timeline_grid=timeline_grid,
        hourly_crew_load=hourly_crew_load
    )
