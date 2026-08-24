"""
Data models and schemas for Indian Railways Automatic Block Planning (SIH26027)
"""

from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field


class Station(BaseModel):
    code: str
    name: str
    division: str = "Prayagraj (NCR)"
    zone: str = "North Central Railway"
    km_mark: float
    latitude: float
    longitude: float


class TrackSection(BaseModel):
    section_id: str
    name: str
    from_station: str
    to_station: str
    length_km: float
    max_speed_kmph: int = 130
    track_type: Literal["UP", "DOWN", "BIDIRECTIONAL"] = "BIDIRECTIONAL"
    capacity_trains_per_hour: float = 4.0
    risk_score: float = Field(..., ge=0, le=100, description="Asset risk score 0-100 (higher = worse condition)")
    pway_health: float = Field(..., ge=0, le=100)
    ohe_health: float = Field(..., ge=0, le=100)
    signal_health: float = Field(..., ge=0, le=100)
    days_since_last_maintenance: int = 0
    hourly_traffic_density: List[float] = Field(default_factory=list, description="24 values for hourly train density")


class Train(BaseModel):
    train_number: str
    train_name: str
    train_type: Literal["VANDE_BHARAT", "RAJDHANI", "SHATABDI", "SUPERFAST", "EXPRESS", "FREIGHT"]
    priority: int = Field(..., ge=1, le=3, description="1: Must-Run, 2: Regular Passenger, 3: Flexible Freight")
    is_must_run: bool = False
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    section_slots: Dict[str, List[int]] = Field(
        default_factory=dict,
        description="Map of section_id to list of occupied time slots (0-23)"
    )
    passengers_estimated: int = 0


class BlockRequest(BaseModel):
    id: str
    section_id: str
    department: Literal["ENGINEERING", "TRD_ELECTRICAL", "SIGNAL_TELECOM", "MECHANICAL"]
    work_type: str
    duration_hours: int = Field(..., ge=1, le=8)
    urgency_score: float = Field(..., ge=0, le=100)
    preferred_start_window: List[int] = Field(default=[0, 23], min_length=2, max_length=2)
    machine_type: str = "Manual Gang"
    block_type: Literal["TRAFFIC_BLOCK", "POWER_BLOCK", "COMBINED_BLOCK"] = "TRAFFIC_BLOCK"
    status: Literal["PENDING", "GRANTED", "REJECTED", "APPROVED"] = "PENDING"
    assigned_start_slot: Optional[int] = None
    assigned_slots: Optional[List[int]] = None
    reason: Optional[str] = None
    approved_by_controller: bool = False


class OptimizationWeights(BaseModel):
    weight_risk: float = Field(1.2, ge=0.1, le=5.0)
    weight_disruption: float = Field(1.0, ge=0.1, le=5.0)
    weight_backlog: float = Field(0.8, ge=0.1, le=5.0)
    crew_limit: int = Field(4, ge=1, le=10)
    enforce_must_run: bool = True


class OptimizationRequest(BaseModel):
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)
    custom_requests: Optional[List[BlockRequest]] = None


class DecisionReason(BaseModel):
    request_id: str
    section_id: str
    department: str
    work_type: str
    status: str
    urgency_score: float
    assigned_start_slot: Optional[int] = None
    assigned_slots: Optional[List[int]] = None
    primary_reason: str
    detailed_explanation: str
    traffic_density_during_slot: Optional[float] = None
    conflicting_must_run_trains: List[str] = Field(default_factory=list)
    risk_mitigation_impact: str
    crew_utilization_at_slot: Optional[int] = None


class KPISummary(BaseModel):
    total_requests: int
    granted_requests: int
    rejected_requests: int
    grant_rate_pct: float
    total_requested_hours: int
    total_granted_hours: int
    block_productivity_pct: float
    initial_network_risk: float
    remaining_network_risk: float
    risk_mitigated_pct: float
    passenger_train_delay_minutes: int
    must_run_train_conflicts: int
    peak_crew_utilization: int
    max_crew_capacity: int
    solver_status: str
    solve_time_ms: float


class OptimizationResult(BaseModel):
    kpis: KPISummary
    scheduled_requests: List[BlockRequest]
    decisions: List[DecisionReason]
    timeline_grid: Dict[str, List[Optional[str]]] = Field(
        default_factory=dict,
        description="section_id -> list of 24 items (request_id or None)"
    )
    hourly_crew_load: List[int] = Field(default_factory=list)


class NetworkData(BaseModel):
    stations: List[Station]
    sections: List[TrackSection]
    trains: List[Train]
    requests: List[BlockRequest]
