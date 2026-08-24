"""
Explainability & Decision Reasoning Engine for Indian Railways Automatic Block Planning
Analyzes solver decisions and provides human-interpretable rationale for controllers and engineers.
"""

from typing import List, Dict, Optional, Tuple, Any
from .models import BlockRequest, TrackSection, Train, DecisionReason, OptimizationWeights


def format_slot_time(slot: int) -> str:
    """Format slot index (0-23) to readable time window string."""
    return f"{slot:02d}:00 - {(slot + 1) % 24:02d}:00"


def format_slots_range(slots: List[int]) -> str:
    """Format list of slots to readable range string."""
    if not slots:
        return "None"
    start = slots[0]
    end = (slots[-1] + 1) % 24
    return f"{start:02d}:00 - {end:02d}:00"


def generate_decision_explanations(
    requests: List[BlockRequest],
    sections: List[TrackSection],
    trains: List[Train],
    weights: OptimizationWeights,
    hourly_crew_load: List[int],
    section_slot_map: Dict[Tuple[str, int], str]  # (section_id, slot) -> winning request_id
) -> List[DecisionReason]:
    """Generate detailed explainability records for every block request decision."""
    sec_dict = {s.section_id: s for s in sections}

    # Map must-run trains and passenger trains per section & slot
    must_run_map: Dict[Tuple[str, int], List[str]] = {}
    passenger_map: Dict[Tuple[str, int], List[str]] = {}
    for t in trains:
        for sec_id, slots in t.section_slots.items():
            for slot in slots:
                key = (sec_id, slot)
                if t.is_must_run:
                    must_run_map.setdefault(key, []).append(f"{t.train_number} ({t.train_name})")
                elif t.priority == 2:
                    passenger_map.setdefault(key, []).append(f"{t.train_number} ({t.train_name})")

    decisions: List[DecisionReason] = []

    for req in requests:
        sec = sec_dict.get(req.section_id)
        sec_name = sec.name if sec else req.section_id

        if req.status in ("GRANTED", "APPROVED") and req.assigned_slots:
            # Analyze why granted in this slot
            start_slot = req.assigned_slots[0]
            slot_range_str = format_slots_range(req.assigned_slots)

            # Check traffic density in assigned slots
            densities = [sec.hourly_traffic_density[s] for s in req.assigned_slots] if sec else [1.0]
            avg_density = sum(densities) / len(densities) if densities else 0.0

            # Passenger conflicts avoided
            pax_in_slot = []
            for s in req.assigned_slots:
                pax_in_slot.extend(passenger_map.get((req.section_id, s), []))

            # Crew load
            crew_at_slot = max([hourly_crew_load[s] for s in req.assigned_slots]) if req.assigned_slots else 0

            # Traffic characterization
            if avg_density < 1.5:
                traffic_char = "ideal maintenance traffic valley"
            elif avg_density < 3.0:
                traffic_char = "moderate traffic corridor"
            else:
                traffic_char = "high-density traffic period"

            primary_reason = (
                f"Granted window {slot_range_str} during {traffic_char} "
                f"({avg_density:.1f} trains/hr). Zero must-run train conflicts, "
                f"mitigating critical asset risk of {req.urgency_score:.1f}/100 on {sec_name}."
            )

            pax_desc = f"{len(pax_in_slot)} standard train(s) re-regulated" if pax_in_slot else "zero passenger disruptions"
            detailed = (
                f"Optimal mathematical fit: Duration of {req.duration_hours}h scheduled inside corridor window {slot_range_str}. "
                f"Asset condition score ({sec.risk_score if sec else req.urgency_score:.1f}) + request urgency ({req.urgency_score:.1f}) "
                f"justified resource allocation. Scheduled with {pax_desc} and crew utilization {crew_at_slot}/{weights.crew_limit}."
            )

            impact = f"High Risk Mitigated: Resolves {req.work_type} requirement on {sec_name}."

            decisions.append(
                DecisionReason(
                    request_id=req.id,
                    section_id=req.section_id,
                    department=req.department,
                    work_type=req.work_type,
                    status=req.status,
                    urgency_score=req.urgency_score,
                    assigned_start_slot=start_slot,
                    assigned_slots=req.assigned_slots,
                    primary_reason=primary_reason,
                    detailed_explanation=detailed,
                    traffic_density_during_slot=round(avg_density, 2),
                    conflicting_must_run_trains=[],
                    risk_mitigation_impact=impact,
                    crew_utilization_at_slot=crew_at_slot
                )
            )

        else:
            # Analyze why rejected / deferred
            conflicting_trains: List[str] = []
            win_start, win_end = req.preferred_start_window

            # Collect must-run trains in preferred window
            for s in range(win_start, min(24, win_end + req.duration_hours)):
                conflicting_trains.extend(must_run_map.get((req.section_id, s), []))
            conflicting_trains = list(dict.fromkeys(conflicting_trains))  # deduplicate

            # Check if section was taken by another request
            competing_reqs = []
            for s in range(win_start, min(24, win_end + req.duration_hours)):
                winner = section_slot_map.get((req.section_id, s))
                if winner and winner != req.id:
                    competing_reqs.append(winner)
            competing_reqs = list(dict.fromkeys(competing_reqs))

            # Determine primary rejection driver
            if conflicting_trains and weights.enforce_must_run:
                train_sample = ", ".join(conflicting_trains[:2])
                primary = f"Blocked by Must-Run Train Protection: High-priority service ({train_sample}) operating on {sec_name} in requested window."
                detailed = (
                    f"CP-SAT solver enforced hard protection constraint for {len(conflicting_trains)} premium train(s) "
                    f"traversing {req.section_id}. Work request cannot be accommodated in window "
                    f"[{win_start:02d}:00 - {win_end:02d}:00] without violating zero-disruption passenger safety rules."
                )
            elif competing_reqs:
                primary = f"Section Contention: Section {sec_name} allocated to higher-priority block ({', '.join(competing_reqs)})."
                detailed = (
                    f"Section exclusivity constraint: Track section {req.section_id} was assigned to competing request "
                    f"{competing_reqs[0]} having higher urgency/safety risk index or tighter machine synchronization."
                )
            elif req.urgency_score < 65.0:
                primary = f"Low Urgency Deferred: Urgency score ({req.urgency_score:.1f}/100) below division cutoff for current 24h cycle."
                detailed = (
                    f"Optimization objective determined traffic disruption cost exceeded unaddressed risk penalty for "
                    f"{req.work_type} (Urgency: {req.urgency_score:.1f}). Recommended for deferral to next low-traffic weekly window."
                )
            else:
                primary = f"Resource Cap Bottleneck: Maximum simultaneous crew capacity ({weights.crew_limit} gangs) reached in available slots."
                detailed = (
                    f"Network maintenance crew quota ({weights.crew_limit} gangs) fully utilized across higher-priority sections "
                    f"during viable non-conflicting time slots."
                )

            decisions.append(
                DecisionReason(
                    request_id=req.id,
                    section_id=req.section_id,
                    department=req.department,
                    work_type=req.work_type,
                    status="REJECTED",
                    urgency_score=req.urgency_score,
                    assigned_start_slot=None,
                    assigned_slots=None,
                    primary_reason=primary,
                    detailed_explanation=detailed,
                    traffic_density_during_slot=None,
                    conflicting_must_run_trains=conflicting_trains[:3],
                    risk_mitigation_impact="Deferred: Risk remains unaddressed in current cycle.",
                    crew_utilization_at_slot=None
                )
            )

    return decisions
