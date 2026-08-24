import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import TimelineGrid from './components/TimelineGrid';
import ExplainabilityModal from './components/ExplainabilityModal';
import WhatIfSandbox from './components/WhatIfSandbox';
import CorridorMap from './components/CorridorMap';
import AnalyticsCharts from './components/AnalyticsCharts';
import AddRequestModal from './components/AddRequestModal';
import RequestsTable from './components/RequestsTable';
import { fetchNetwork, fetchTrains, fetchRequests, fetchKPIs, runOptimization, resetFixtures, updateBlockRequest } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [network, setNetwork] = useState({ stations: [], sections: [] });
  const [trains, setTrains] = useState([]);
  const [requests, setRequests] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [timelineGrid, setTimelineGrid] = useState({});
  const [hourlyCrewLoad, setHourlyCrewLoad] = useState(Array(24).fill(0));
  const [decisions, setDecisions] = useState([]);

  // UI Modals & Drawers
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentWeights, setCurrentWeights] = useState({
    weight_risk: 1.2,
    weight_disruption: 1.0,
    weight_backlog: 0.8,
    crew_limit: 4,
    enforce_must_run: true,
  });

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [netRes, trainRes, reqRes, kpiRes] = await Promise.all([
        fetchNetwork(),
        fetchTrains(),
        fetchRequests(),
        fetchKPIs(),
      ]);

      setNetwork(netRes);
      setTrains(trainRes);
      setRequests(reqRes);
      setKpiData(kpiRes);

      // Rebuild initial grid
      const grid = {};
      netRes.sections.forEach((sec) => {
        grid[sec.section_id] = Array(24).fill(null);
      });
      reqRes.forEach((r) => {
        if ((r.status === 'GRANTED' || r.status === 'APPROVED') && r.assigned_slots) {
          r.assigned_slots.forEach((s) => {
            if (grid[r.section_id]) {
              grid[r.section_id][s] = r.id;
            }
          });
        }
      });
      setTimelineGrid(grid);
      setHourlyCrewLoad(kpiRes.hourly_crew_load || Array(24).fill(0));
    } catch (err) {
      console.error("Failed to load initial data:", err);
      showNotification("Error connecting to backend API. Please ensure FastAPI is running.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRunOptimization = async () => {
    try {
      setIsOptimizing(true);
      const res = await runOptimization(currentWeights);
      setRequests(res.scheduled_requests);
      setTimelineGrid(res.timeline_grid);
      setHourlyCrewLoad(res.hourly_crew_load);
      setDecisions(res.decisions);

      // Refresh KPI data
      const newKpis = await fetchKPIs();
      setKpiData(newKpis);

      showNotification(`Optimization completed: ${res.kpis.granted_requests} of ${res.kpis.total_requests} demands granted in ${res.kpis.solve_time_ms}ms.`);
    } catch (err) {
      console.error("Optimization failed:", err);
      showNotification("Optimization failed.", "error");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetFixtures();
      await loadInitialData();
      showNotification("Reset to baseline Indian Railways synthetic fixtures.");
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  const handleApplyWhatIf = (result, newWeights) => {
    setCurrentWeights(newWeights);
    setRequests(result.scheduled_requests);
    setTimelineGrid(result.timeline_grid);
    setHourlyCrewLoad(result.hourly_crew_load);
    setDecisions(result.decisions);
    fetchKPIs().then(setKpiData);
    showNotification(`What-If Applied: ${result.kpis.granted_requests} demands scheduled under new policy.`);
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
  };

  const handleUpdateRequestUrgency = async (reqId, newUrgency) => {
    try {
      await updateBlockRequest(reqId, { urgency_score: newUrgency });
      await handleRunOptimization();
      showNotification(`Urgency of ${reqId} updated to ${newUrgency} and re-optimized.`);
    } catch (err) {
      console.error("Error updating urgency:", err);
    }
  };

  // Find decision record for selected request
  const selectedDecision = selectedRequest
    ? decisions.find((d) => d.request_id === selectedRequest.id) || {
        request_id: selectedRequest.id,
        primary_reason: selectedRequest.reason || 'Processed by CP-SAT solver.',
        status: selectedRequest.status,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-medium font-mono animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-cyan-950 border-cyan-800 text-cyan-200'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunOptimization={handleRunOptimization}
        onReset={handleReset}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isOptimizing={isOptimizing}
        kpis={kpiData?.summary}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <KPICards kpis={kpiData?.summary} />

        {/* Tab Views */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-mono text-xs">Loading Corridor Network & Solver Engine...</span>
          </div>
        ) : (
          <>
            {activeTab === 'timeline' && (
              <TimelineGrid
                sections={network.sections}
                requests={requests}
                timelineGrid={timelineGrid}
                trains={trains}
                onSelectRequest={handleSelectRequest}
                selectedRequestId={selectedRequest?.id}
                hourlyCrewLoad={hourlyCrewLoad}
              />
            )}

            {activeTab === 'map' && (
              <CorridorMap
                stations={network.stations}
                sections={network.sections}
                requests={requests}
                onSelectSection={(secId) => {
                  console.log("Selected section:", secId);
                }}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsCharts kpiData={kpiData} />}

            {activeTab === 'requests' && (
              <RequestsTable
                requests={requests}
                onSelectRequest={handleSelectRequest}
                onRefresh={loadInitialData}
              />
            )}
          </>
        )}
      </main>

      {/* Explainability Inspector Drawer */}
      {selectedRequest && (
        <ExplainabilityModal
          request={selectedRequest}
          decision={selectedDecision}
          onClose={() => setSelectedRequest(null)}
          onUpdateRequest={handleUpdateRequestUrgency}
          onRefresh={loadInitialData}
        />
      )}

      {/* What-If Sandbox Drawer */}
      <WhatIfSandbox
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        currentWeights={currentWeights}
        requests={requests}
        onApplyOptimization={handleApplyWhatIf}
        onUpdateRequestUrgency={handleUpdateRequestUrgency}
      />

      {/* Add Demand Modal */}
      <AddRequestModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sections={network.sections}
        onDemandAdded={loadInitialData}
      />
    </div>
  );
}
