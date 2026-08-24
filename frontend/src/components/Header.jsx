import React from 'react';
import { Play, RotateCcw, Sliders, PlusCircle, Train, ShieldCheck, Activity, Cpu } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onRunOptimization,
  onReset,
  onOpenWhatIf,
  onOpenAddModal,
  isOptimizing,
  kpis
}) {
  return (
    <header className="bg-[#162238] border-b border-[#2A3B53] shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Indian Railways</span>
                  <span className="text-cyan-400 font-mono text-sm px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60">
                    SIH26027
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  AI Engine Online
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Automatic Block Planning System • Prayagraj Division (NCR) Trunk Corridor (NDLS - DDU)
              </p>
            </div>
          </div>

          {/* Action Buttons & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {kpis && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B132B] border border-[#2A3B53] text-xs">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Solver:</span>
                <span className="font-mono font-semibold text-emerald-400">{kpis.solver_status}</span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-slate-300">{kpis.solve_time_ms} ms</span>
              </div>
            )}

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C2541] hover:bg-[#2A3B53] text-slate-200 hover:text-white border border-[#2A3B53] text-xs font-medium transition-all shadow-sm"
              title="Add a new track maintenance block demand"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Demand</span>
            </button>

            <button
              onClick={onOpenWhatIf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C2541] hover:bg-[#2A3B53] text-amber-300 hover:text-amber-200 border border-amber-800/40 text-xs font-medium transition-all shadow-sm"
              title="Open What-If Simulation Sandbox"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>What-If Sandbox</span>
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] text-slate-400 hover:text-slate-200 border border-[#2A3B53] text-xs font-medium transition-all"
              title="Reset to default synthetic fixtures"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onRunOptimization}
              disabled={isOptimizing}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Solving CP-SAT...' : 'Re-Optimize'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mt-3.5 pt-2.5 border-t border-[#2A3B53]/60 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/60'
            }`}
          >
            🗓️ Corridor Timeline (Gantt Matrix)
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/60'
            }`}
          >
            🗺️ Corridor Topology & Health
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/60'
            }`}
          >
            📊 Analytics & KPIs
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/60'
            }`}
          >
            📋 Demands Register ({kpis ? kpis.total_requests : 0})
          </button>
        </div>
      </div>
    </header>
  );
}
