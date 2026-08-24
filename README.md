# AI-Powered Automatic Block Planning System for Indian Railways (SIH26027)

> **Smart India Hackathon Problem Statement SIH26027**: Recommending optimal "traffic block" (track maintenance window) schedules that balance maintenance access against train-service disruption on Indian Railways high-density trunk routes.

---

## Key Features

- 🚆 **Realistic HDN Trunk Corridor Simulation**: Models 11 stations (New Delhi to Pt. Deen Dayal Upadhyaya Jn), 11 track sections, 44 scheduled trains (Vande Bharat, Rajdhani, Shatabdi, Superfast, Freight), and 38 multi-department maintenance demands.
- ⚙️ **Mathematical Optimization (Google OR-Tools CP-SAT)**: Discrete constraint programming guaranteeing zero double-booked sections, zero must-run train violations, and compliance with network maintenance crew limits.
- 🧠 **Explainability & Decision Reasoning**: Every scheduled and rejected demand includes human-readable explainability breakdown showing traffic density valley indices, passenger disruption costs, and constraint bottlenecks.
- 🎛️ **Interactive "What-If" Simulation Sandbox**: Real-time policy weight tuning ($W_{\text{risk}}$, $W_{\text{disrupt}}$, crew limits) with instant re-optimization.
- 🗺️ **Corridor Topology Map & Health Inspector**: Schematic diagram showing live section risk degradation and active maintenance allocations.
- 📊 **Departmental & Divisional Analytics**: Real-time KPI dashboards tracking Block Productivity %, Demands Granted %, Risk Mitigated %, and Hourly Crew Utilization.

---

## Quickstart & Installation

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** / npm

---

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run backend unit & constraint verification tests
python -m pytest tests/ -v

# Start FastAPI backend server (Runs on port 8000)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite React development server (Runs on port 5173)
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py          # Pydantic schemas (Station, Section, Train, BlockRequest, KPIs)
│   │   ├── generator.py       # Realistic Indian Railways synthetic corridor generator
│   │   ├── optimizer.py       # Google OR-Tools CP-SAT mathematical solver
│   │   ├── explainability.py  # Decision reasoning engine
│   │   ├── kpi_service.py     # Divisional KPI calculations
│   │   ├── db.py              # In-memory / state management store
│   │   └── main.py            # FastAPI REST endpoints
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                # Top bar with division selector & status
│   │   │   ├── KPICards.jsx              # Divisional performance metric cards
│   │   │   ├── TimelineGrid.jsx          # 24h Corridor Master Gantt Matrix
│   │   │   ├── ExplainabilityModal.jsx   # AI decision inspector & math breakdown
│   │   │   ├── WhatIfSandbox.jsx         # Interactive policy & priority slider sandbox
│   │   │   ├── CorridorMap.jsx           # Schematic track topology & health
│   │   │   ├── AnalyticsCharts.jsx       # Recharts departmental & crew visualizations
│   │   │   ├── AddRequestModal.jsx       # Emergency block demand submission form
│   │   │   └── RequestsTable.jsx         # Full demand register with controller actions
│   │   ├── App.jsx                       # Root application component
│   │   ├── api.js                        # Axios API client
│   │   ├── index.css                     # Tailwind custom styling & glow effects
│   │   └── main.jsx                      # React entrypoint
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── tests/
│   ├── test_optimizer.py      # Assertions: zero overlap, must-run protection, crew cap
│   └── test_api.py            # FastAPI integration tests
├── requirements.txt
├── ARCHITECTURE.md            # 4-layer architecture & Indian Railways integration roadmap
└── README.md
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/network` | Stations, track sections, and asset risk scores |
| `GET` | `/api/trains` | 24-hour scheduled train timetable |
| `GET` | `/api/requests` | Maintenance block demands register |
| `POST` | `/api/requests` | Register a new block demand (for What-If simulation) |
| `PUT` | `/api/requests/{id}` | Update demand urgency or preferred window |
| `POST` | `/api/optimize` | Execute CP-SAT solver with custom weights |
| `POST` | `/api/requests/{id}/approve` | Controller approval/rejection toggle |
| `GET` | `/api/kpis` | Divisional KPIs, departmental breakdown, section health |
| `POST` | `/api/reset` | Reset network state to baseline fixtures |

---

## Mathematical Solver Assertions

The solver is verified with automated tests in `tests/test_optimizer.py`:
1. **Section Exclusivity**: $\sum_{r \in R(s)} u_{r, t} \le 1 \quad \forall s, \forall t$.
2. **Must-Run Protection**: $u_{r, t} = 0$ for all $(s, t)$ with Vande Bharat / Rajdhani scheduled.
3. **Crew Resource Quota**: $\sum_{r \in R} u_{r, t} \le \text{CrewLimit} \quad \forall t$.
4. **Feasibility**: High-urgency demands prioritized during low-traffic maintenance valleys.
