"""
KPI and Performance Analytics Service for Indian Railways Block Planning
Calculates divisional productivity metrics, risk mitigation curves, and departmental statistics.
"""

from typing import Dict, Any, List
from .models import KPISummary, BlockRequest, TrackSection, OptimizationResult


def compute_department_breakdown(requests: List[BlockRequest]) -> Dict[str, Any]:
    """Break down demands and grants by department (Civil, Electrical, S&T, Mech)."""
    dept_stats: Dict[str, Dict[str, Any]] = {
        "ENGINEERING": {"name": "Engineering (P-Way)", "total": 0, "granted": 0, "hours_granted": 0, "avg_urgency": 0.0},
        "TRD_ELECTRICAL": {"name": "TRD (Electrical)", "total": 0, "granted": 0, "hours_granted": 0, "avg_urgency": 0.0},
        "SIGNAL_TELECOM": {"name": "Signal & Telecom (S&T)", "total": 0, "granted": 0, "hours_granted": 0, "avg_urgency": 0.0},
        "MECHANICAL": {"name": "Mechanical / Bridge", "total": 0, "granted": 0, "hours_granted": 0, "avg_urgency": 0.0},
    }

    dept_urg_sums = {k: 0.0 for k in dept_stats}

    for req in requests:
        dept = req.department
        if dept in dept_stats:
            dept_stats[dept]["total"] += 1
            dept_urg_sums[dept] += req.urgency_score
            if req.status in ("GRANTED", "APPROVED"):
                dept_stats[dept]["granted"] += 1
                dept_stats[dept]["hours_granted"] += req.duration_hours

    for dept, data in dept_stats.items():
        if data["total"] > 0:
            data["avg_urgency"] = round(dept_urg_sums[dept] / data["total"], 1)
            data["grant_rate"] = round((data["granted"] / data["total"]) * 100.0, 1)
        else:
            data["grant_rate"] = 0.0

    return dept_stats


def compute_section_risk_profiles(sections: List[TrackSection], requests: List[BlockRequest]) -> List[Dict[str, Any]]:
    """Compute risk mitigation impact per track section."""
    sec_reqs: Dict[str, List[BlockRequest]] = {}
    for r in requests:
        sec_reqs.setdefault(r.section_id, []).append(r)

    profiles = []
    for s in sections:
        reqs = sec_reqs.get(s.section_id, [])
        total_d = len(reqs)
        granted_d = sum(1 for r in reqs if r.status in ("GRANTED", "APPROVED"))
        hours_maint = sum(r.duration_hours for r in reqs if r.status in ("GRANTED", "APPROVED"))

        # Post maintenance risk score reduction simulation
        risk_reduction = min(s.risk_score * 0.6, hours_maint * 8.0)
        projected_risk = max(10.0, round(s.risk_score - risk_reduction, 1))

        profiles.append({
            "section_id": s.section_id,
            "name": s.name,
            "length_km": s.length_km,
            "max_speed_kmph": s.max_speed_kmph,
            "current_risk": s.risk_score,
            "projected_risk": projected_risk,
            "demands_total": total_d,
            "demands_granted": granted_d,
            "maintenance_hours": hours_maint,
            "health": {
                "pway": s.pway_health,
                "ohe": s.ohe_health,
                "signal": s.signal_health
            }
        })

    return profiles
