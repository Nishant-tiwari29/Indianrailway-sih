"""
FastAPI Main Application for Indian Railways Automatic Block Planning (SIH26027)
Provides REST endpoints for network discovery, timetable, block requests,
OR-Tools optimization, controller approvals, and real-time KPI analytics.
"""

from fastapi import FastAPI, HTTPException, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

from .models import (
    NetworkData,
    BlockRequest,
    OptimizationRequest,
    OptimizationResult,
    KPISummary,
    TrackSection,
    Station,
    Train
)
from .db import db
from .optimizer import solve_block_schedule
from .kpi_service import compute_department_breakdown, compute_section_risk_profiles

app = FastAPI(
    title="Indian Railways Automatic Block Planning API",
    description="AI-Powered Decision Support Tool for Track Maintenance Scheduling (SIH26027)",
    version="1.0.0"
)

# CORS middleware for React / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "system": "Indian Railways AI Automatic Block Planning System",
        "problem_id": "SIH26027",
        "division": "Prayagraj Division (North Central Railway)",
        "status": "OPERATIONAL",
        "endpoints": [
            "/api/network",
            "/api/trains",
            "/api/requests",
            "/api/optimize",
            "/api/kpis"
        ]
    }


@app.get("/api/network")
def get_network():
    """Retrieve corridor topology, stations, track sections, and asset risk profiles."""
    return {
        "stations": db.network_data.stations,
        "sections": db.network_data.sections
    }


@app.get("/api/trains", response_model=List[Train])
def get_trains():
    """Retrieve 24-hour scheduled train timetable across the corridor."""
    return db.network_data.trains


@app.get("/api/requests", response_model=List[BlockRequest])
def get_requests():
    """Retrieve all maintenance block requests with current scheduling status."""
    return db.get_requests()


@app.post("/api/requests", response_model=BlockRequest)
def create_request(request: BlockRequest):
    """Create a new maintenance block demand (for What-If simulation)."""
    # Ensure unique ID if not provided or collision
    if not request.id or any(r.id == request.id for r in db.network_data.requests):
        import uuid
        request.id = f"REQ-NEW-{uuid.uuid4().hex[:6].upper()}"

    created = db.add_request(request)
    return created


@app.put("/api/requests/{request_id}", response_model=BlockRequest)
def update_request(request_id: str, updates: Dict[str, Any] = Body(...)):
    """Update block request urgency, duration, or preferred window."""
    updated = db.update_request(request_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Request {request_id} not found")
    return updated


@app.post("/api/optimize", response_model=OptimizationResult)
def optimize_schedule(req: OptimizationRequest = Body(...)):
    """
    Execute Google OR-Tools CP-SAT solver to compute optimal block plan.
    Supports dynamic weights and custom request overrides for What-If scenarios.
    """
    requests_to_solve = req.custom_requests if req.custom_requests else db.network_data.requests

    result = solve_block_schedule(
        requests=requests_to_solve,
        sections=db.network_data.sections,
        trains=db.network_data.trains,
        weights=req.weights
    )

    # Update database state with new solution
    db.last_result = result
    db.current_weights = req.weights

    # Sync back scheduled status into stored requests
    sched_map = {r.id: r for r in result.scheduled_requests}
    for i, r in enumerate(db.network_data.requests):
        if r.id in sched_map:
            db.network_data.requests[i] = sched_map[r.id]

    return result


@app.post("/api/requests/{request_id}/approve", response_model=BlockRequest)
def approve_request(request_id: str, approve: bool = True):
    """Divisional Controller action to officially approve or revoke a recommended block."""
    updated = db.approve_request(request_id, approve=approve)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Request {request_id} not found")
    return updated


@app.get("/api/kpis")
def get_kpis():
    """Retrieve comprehensive KPIs, departmental breakdowns, and section risk profiles."""
    if not db.last_result:
        db.run_initial_optimization()

    dept_breakdown = compute_department_breakdown(db.network_data.requests)
    sec_profiles = compute_section_risk_profiles(db.network_data.sections, db.network_data.requests)

    return {
        "summary": db.last_result.kpis if db.last_result else None,
        "department_breakdown": dept_breakdown,
        "section_profiles": sec_profiles,
        "hourly_crew_load": db.last_result.hourly_crew_load if db.last_result else [0] * 24,
        "weights": db.current_weights
    }


@app.post("/api/reset")
def reset_fixtures():
    """Reset network state and block demands to baseline synthetic dataset."""
    db.reset_to_defaults()
    return {
        "message": "System successfully reset to baseline synthetic fixtures.",
        "kpis": db.last_result.kpis if db.last_result else None
    }


# Mount frontend static build if available (for single-container production hosting)
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static_frontend")

