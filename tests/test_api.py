"""
API Integration Tests for Indian Railways Block Planning Backend
"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["problem_id"] == "SIH26027"
    assert data["status"] == "OPERATIONAL"


def test_get_network():
    response = client.get("/api/network")
    assert response.status_code == 200
    data = response.json()
    assert "stations" in data
    assert "sections" in data
    assert len(data["stations"]) >= 10
    assert len(data["sections"]) >= 10


def test_get_trains():
    response = client.get("/api/trains")
    assert response.status_code == 200
    trains = response.json()
    assert len(trains) >= 40
    # Verify must-run train exists
    must_runs = [t for t in trains if t["is_must_run"]]
    assert len(must_runs) > 0


def test_get_requests_and_optimize():
    # Initial requests
    response = client.get("/api/requests")
    assert response.status_code == 200
    reqs = response.json()
    assert len(reqs) >= 30

    # Run optimize endpoint
    opt_payload = {
        "weights": {
            "weight_risk": 1.5,
            "weight_disruption": 1.0,
            "weight_backlog": 0.8,
            "crew_limit": 4,
            "enforce_must_run": True
        }
    }
    opt_response = client.post("/api/optimize", json=opt_payload)
    assert opt_response.status_code == 200
    result = opt_response.json()
    assert "kpis" in result
    assert result["kpis"]["granted_requests"] > 0
    assert result["kpis"]["must_run_train_conflicts"] == 0
    assert "decisions" in result
    assert len(result["decisions"]) == len(reqs)


def test_controller_approval_flow():
    # Fetch requests
    response = client.get("/api/requests")
    reqs = response.json()
    target_req = reqs[0]

    # Approve
    appr_res = client.post(f"/api/requests/{target_req['id']}/approve?approve=true")
    assert appr_res.status_code == 200
    assert appr_res.json()["approved_by_controller"] is True


def test_kpis_endpoint():
    response = client.get("/api/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "department_breakdown" in data
    assert "section_profiles" in data
    assert "hourly_crew_load" in data
    assert len(data["hourly_crew_load"]) == 24


def test_reset_endpoint():
    response = client.post("/api/reset")
    assert response.status_code == 200
    assert "message" in response.json()
