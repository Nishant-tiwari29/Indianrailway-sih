"""
State Management & Persistence for Indian Railways Block Planning Prototype
Holds current network data, scheduled state, what-if scenarios, and controller approvals.
"""

from typing import Optional, Dict, List, Any
from .models import NetworkData, BlockRequest, OptimizationResult, OptimizationWeights
from .generator import generate_network_data
from .optimizer import solve_block_schedule


class DatabaseState:
    """In-memory data store with live state updates and fixture resets."""

    def __init__(self):
        self.network_data: NetworkData = generate_network_data(seed=42)
        self.current_weights: OptimizationWeights = OptimizationWeights()
        self.last_result: Optional[OptimizationResult] = None
        self.run_initial_optimization()

    def run_initial_optimization(self) -> OptimizationResult:
        """Run initial baseline optimization on startup."""
        self.last_result = solve_block_schedule(
            requests=self.network_data.requests,
            sections=self.network_data.sections,
            trains=self.network_data.trains,
            weights=self.current_weights
        )
        # Synchronize requests with schedule status
        sched_map = {r.id: r for r in self.last_result.scheduled_requests}
        for i, r in enumerate(self.network_data.requests):
            if r.id in sched_map:
                self.network_data.requests[i] = sched_map[r.id]
        return self.last_result

    def reset_to_defaults(self) -> NetworkData:
        """Reset network and requests to synthetic baseline fixtures."""
        self.network_data = generate_network_data(seed=42)
        self.current_weights = OptimizationWeights()
        self.run_initial_optimization()
        return self.network_data

    def get_requests(self) -> List[BlockRequest]:
        return self.network_data.requests

    def add_request(self, new_req: BlockRequest) -> BlockRequest:
        self.network_data.requests.insert(0, new_req)
        return new_req

    def update_request(self, req_id: str, updates: Dict[str, Any]) -> Optional[BlockRequest]:
        for i, r in enumerate(self.network_data.requests):
            if r.id == req_id:
                updated_req = r.model_copy(update=updates)
                self.network_data.requests[i] = updated_req
                return updated_req
        return None

    def approve_request(self, req_id: str, approve: bool = True) -> Optional[BlockRequest]:
        for i, r in enumerate(self.network_data.requests):
            if r.id == req_id:
                new_status = "APPROVED" if approve else ("GRANTED" if r.assigned_slots else "REJECTED")
                updated_req = r.model_copy(update={
                    "approved_by_controller": approve,
                    "status": new_status
                })
                self.network_data.requests[i] = updated_req
                return updated_req
        return None


# Global singleton instance
db = DatabaseState()
