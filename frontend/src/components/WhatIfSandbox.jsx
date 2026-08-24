import React, { useState } from 'react';
import {
  X,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Users,
  Train,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { runOptimization } from '../api';

export default function WhatIfSandbox({
  isOpen,
  onClose,
  currentWeights,
  requests,
  onApplyOptimization,
  onUpdateRequestUrgency
}) {
  if (!isOpen) return null;

  const [weights, setWeights] = useState({
    weight_risk: currentWeights?.weight_risk ?? 1.2,
    weight_disruption: currentWeights?.weight_disruption ?? 1.0,
    weight_backlog: currentWeights?.weight_backlog ?? 0.8,
    crew_limit: currentWeights?.crew_limit ?? 4,
    enforce_must_run: currentWeights?.enforce_must_run ?? true,
  });

  const [isSolving, setIsSolving] = useState(false);
  const [selectedReqToBoost, setSelectedReqToBoost] = useState('');
  const [boostUrgency, setBoostUrgency] = useState(95);

  const handleResetWeights = () => {
    setWeights({
      weight_risk: 1.2,
      weight_disruption: 1.0,
      weight_backlog: 0.8,
      crew_limit: 4,
      enforce_must_run: true,
    });
  };

  const handleRunWhatIf = async () => {
    try {
      setIsSolving(true);
      const result = await runOptimization(weights);
      onApplyOptimization(result, weights);
      onClose();
    } catch (err) {
      console.error("Error in What-If optimization:", err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleApplyBoost = () => {
    if (selectedReqToBoost && onUpdateRequestUrgency) {
      onUpdateRequestUrgency(selectedReqToBoost, parseFloat(boostUrgency));
    }
  };

  // Find rejected requests to offer quick boosting
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED');

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#162238] border-l border-[#2A3B53] shadow-2xl z-50 overflow-y-auto flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-[#2A3B53] flex items-center justify-between bg-[#1C2541]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <span>What-If Scenario Simulator</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Sandbox
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate policy weight shifts, machine quotas, and demand prioritization
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2A3B53] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1 text-xs">
        {/* Preset Policy Buttons */}
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px] block mb-2.5">
            Quick Operational Presets
          </span>
          <div className="grid grid-cols-3 gap-2 font-medium">
            <button
              onClick={() =>
                setWeights({
                  weight_risk: 2.2,
                  weight_disruption: 0.6,
                  weight_backlog: 1.2,
                  crew_limit: 5,
                  enforce_must_run: true,
                })
              }
              className="p-2.5 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] border border-[#2A3B53] text-left text-slate-200 transition-all hover:border-emerald-500/50"
            >
              <div className="text-emerald-400 font-bold font-mono">Safety First</div>
              <div className="text-[10px] text-slate-400 mt-1">Max risk mitigation, +1 crew</div>
            </button>

            <button
              onClick={() =>
                setWeights({
                  weight_risk: 0.8,
                  weight_disruption: 2.5,
                  weight_backlog: 0.5,
                  crew_limit: 3,
                  enforce_must_run: true,
                })
              }
              className="p-2.5 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] border border-[#2A3B53] text-left text-slate-200 transition-all hover:border-cyan-500/50"
            >
              <div className="text-cyan-400 font-bold font-mono">Traffic Protect</div>
              <div className="text-[10px] text-slate-400 mt-1">Zero passenger delays</div>
            </button>

            <button
              onClick={() =>
                setWeights({
                  weight_risk: 1.5,
                  weight_disruption: 1.0,
                  weight_backlog: 2.0,
                  crew_limit: 6,
                  enforce_must_run: true,
                })
              }
              className="p-2.5 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] border border-[#2A3B53] text-left text-slate-200 transition-all hover:border-indigo-500/50"
            >
              <div className="text-indigo-400 font-bold font-mono">Mega Block Blitz</div>
              <div className="text-[10px] text-slate-400 mt-1">Max grants, 6 crews</div>
            </button>
          </div>
        </div>

        {/* Weights Sliders */}
        <div className="bg-[#0B132B] border border-[#2A3B53] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              CP-SAT Objective Weights
            </span>
            <button
              onClick={handleResetWeights}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* 1. Risk Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Safety Risk Weight (W_risk)</span>
              <span className="font-mono font-bold text-emerald-400">{weights.weight_risk.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={weights.weight_risk}
              onChange={(e) => setWeights({ ...weights, weight_risk: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 bg-slate-800"
            />
            <p className="text-[10px] text-slate-500">
              Higher value forces solver to prioritize high-risk track sections (TGI &gt; 80).
            </p>
          </div>

          {/* 2. Disruption Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Traffic Disruption Weight (W_disrupt)</span>
              <span className="font-mono font-bold text-cyan-400">{weights.weight_disruption.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={weights.weight_disruption}
              onChange={(e) => setWeights({ ...weights, weight_disruption: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 bg-slate-800"
            />
            <p className="text-[10px] text-slate-500">
              Higher value penalizes blocks during passenger train hours or high-density slots.
            </p>
          </div>

          {/* 3. Backlog Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Backlog Clearance Weight (W_backlog)</span>
              <span className="font-mono font-bold text-amber-400">{weights.weight_backlog.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={weights.weight_backlog}
              onChange={(e) => setWeights({ ...weights, weight_backlog: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800"
            />
          </div>

          {/* 4. Crew Limit Cap */}
          <div className="space-y-1.5 pt-2 border-t border-[#2A3B53]">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Network Crew / Machine Quota</span>
              <span className="font-mono font-bold text-indigo-400">{weights.crew_limit} Gangs</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={weights.crew_limit}
              onChange={(e) => setWeights({ ...weights, crew_limit: parseInt(e.target.value) })}
              className="w-full accent-indigo-400 bg-slate-800"
            />
            <p className="text-[10px] text-slate-500">
              Simultaneous active maintenance gangs across Prayagraj Division.
            </p>
          </div>

          {/* 5. Must Run Train Rule */}
          <div className="flex items-center justify-between pt-2 border-t border-[#2A3B53]">
            <div>
              <span className="text-slate-200 font-medium block">Strict Must-Run Protection</span>
              <span className="text-[10px] text-slate-400">Zero tolerance for Vande Bharat / Rajdhani overlap</span>
            </div>
            <input
              type="checkbox"
              checked={weights.enforce_must_run}
              onChange={(e) => setWeights({ ...weights, enforce_must_run: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded bg-slate-800"
            />
          </div>
        </div>

        {/* Quick Demand Priority Escalation */}
        {rejectedRequests.length > 0 && (
          <div className="bg-[#0B132B] border border-[#2A3B53] rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Escalation of Deferred Demands
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400">Select deferred request to escalate:</label>
              <select
                value={selectedReqToBoost}
                onChange={(e) => setSelectedReqToBoost(e.target.value)}
                className="w-full bg-[#162238] border border-[#2A3B53] rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose Deferred Demand --</option>
                {rejectedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.work_type}) - Urgency: {r.urgency_score}
                  </option>
                ))}
              </select>

              {selectedReqToBoost && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400 text-[11px]">Boost Urgency to:</span>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={boostUrgency}
                    onChange={(e) => setBoostUrgency(e.target.value)}
                    className="w-20 bg-[#162238] border border-[#2A3B53] rounded p-1 text-center font-mono text-xs text-white"
                  />
                  <button
                    onClick={handleApplyBoost}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
                  >
                    Escalate
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Re-Optimize CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleRunWhatIf}
            disabled={isSolving}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSolving ? 'Solving What-If Scenario...' : 'Execute What-If Re-Optimization'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
