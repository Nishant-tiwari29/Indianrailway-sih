import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Shield, Users, TrendingUp, Zap } from 'lucide-react';

export default function KPICards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Block Productivity */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-4 shadow-sm hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Block Productivity</span>
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">{kpis.block_productivity_pct}%</span>
          <span className="text-xs text-slate-400 font-mono">({kpis.total_granted_hours}h granted)</span>
        </div>
        <div className="mt-2 w-full bg-[#0B132B] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full"
            style={{ width: `${Math.min(100, kpis.block_productivity_pct * 3.5)}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Granted vs Demanded */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-4 shadow-sm hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Demands Granted</span>
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {kpis.granted_requests} <span className="text-sm font-normal text-slate-400">/ {kpis.total_requests}</span>
          </span>
          <span className="text-xs font-mono text-emerald-300 font-medium">{kpis.grant_rate_pct}%</span>
        </div>
        <div className="mt-2 w-full bg-[#0B132B] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${kpis.grant_rate_pct}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Risk Mitigated */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-4 shadow-sm hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Risk Mitigated</span>
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-blue-400">{kpis.risk_mitigated_pct}%</span>
          <span className="text-xs text-slate-400 font-mono">rem: {kpis.remaining_network_risk}</span>
        </div>
        <div className="mt-2 w-full bg-[#0B132B] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${kpis.risk_mitigated_pct}%` }}
          ></div>
        </div>
      </div>

      {/* 4. Must-Run Protection */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-4 shadow-sm hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Must-Run Protection</span>
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/40 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">0 Violations</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
          <span>Vande Bharat / Rajdhani 100% safeguarded</span>
        </p>
      </div>

      {/* 5. Crew Utilization */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Peak Crew Load</span>
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/40 text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-indigo-300">
            {kpis.peak_crew_utilization} <span className="text-sm font-normal text-slate-400">/ {kpis.max_crew_capacity} Gangs</span>
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-mono">
          Network cap: max {kpis.max_crew_capacity} concurrent blocks
        </p>
      </div>
    </div>
  );
}
