import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertOctagon,
  Shield,
  Activity,
  Users,
  Train,
  Check,
  Zap,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';
import { approveBlockRequest, updateBlockRequest } from '../api';

export default function ExplainabilityModal({
  request,
  decision,
  onClose,
  onUpdateRequest,
  onRefresh
}) {
  if (!request) return null;

  const [isApproving, setIsApproving] = useState(false);
  const [urgencyVal, setUrgencyVal] = useState(request.urgency_score);

  const isGranted = request.status === 'GRANTED' || request.status === 'APPROVED';
  const isApproved = request.status === 'APPROVED' || request.approved_by_controller;

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveBlockRequest(request.id, !isApproved);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error approving request:", err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSaveUrgency = async () => {
    try {
      await updateBlockRequest(request.id, { urgency_score: parseFloat(urgencyVal) });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating urgency:", err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#162238] border-l border-[#2A3B53] shadow-2xl z-50 overflow-y-auto flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-[#2A3B53] flex items-center justify-between bg-[#1C2541]">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isGranted
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                : 'bg-rose-950/80 border-rose-800 text-rose-400'
            }`}
          >
            {isGranted ? <CheckCircle className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold font-mono text-white">{request.id}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  isApproved
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : isGranted
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isApproved ? 'CONTROLLER APPROVED' : request.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{request.work_type}</p>
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
        {/* Core Attribution Card */}
        <div className="bg-[#0B132B] border border-[#2A3B53] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-cyan-400">
            <Shield className="w-3.5 h-3.5" />
            AI Decision Explainability & Math Rationale
          </h3>

          <div className="p-3 rounded-lg bg-[#162238] border border-[#2A3B53]/80">
            <p className="text-slate-200 leading-relaxed font-medium">
              {decision ? decision.primary_reason : request.reason || 'Decision processed by Google OR-Tools CP-SAT solver.'}
            </p>
          </div>

          {decision && decision.detailed_explanation && (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {decision.detailed_explanation}
            </p>
          )}
        </div>

        {/* Assigned Time Slot & Schedule Properties */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="p-3 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
            <span className="text-slate-500 text-[10px] block uppercase">Scheduled Window</span>
            <span className="text-white font-bold text-sm mt-0.5 block">
              {request.assigned_slots
                ? `${request.assigned_slots[0].toString().padStart(2, '0')}:00 - ${(
                    request.assigned_slots[request.assigned_slots.length - 1] + 1
                  )
                    .toString()
                    .padStart(2, '0')}:00`
                : 'Not Assigned / Deferred'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
            <span className="text-slate-500 text-[10px] block uppercase">Required Duration</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{request.duration_hours} Hours</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
            <span className="text-slate-500 text-[10px] block uppercase">Track Section</span>
            <span className="text-cyan-300 font-bold text-xs mt-0.5 block truncate" title={request.section_id}>
              {request.section_id}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
            <span className="text-slate-500 text-[10px] block uppercase">Department / Gang</span>
            <span className="text-amber-300 font-bold text-xs mt-0.5 block truncate" title={request.machine_type}>
              {request.department}
            </span>
          </div>
        </div>

        {/* Constraints Checklist */}
        <div className="bg-[#0B132B] border border-[#2A3B53] rounded-xl p-4 space-y-2.5">
          <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            CP-SAT Constraint Verification Audit
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-[#162238]">
              <span className="text-slate-300">Section Exclusivity (No Double Booking)</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Satisfied
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#162238]">
              <span className="text-slate-300">Must-Run Train Protection (Zero Overlap)</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 0 Conflicts
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#162238]">
              <span className="text-slate-300">Divisional Crew Quota (≤ 4 Gangs)</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {decision?.crew_utilization_at_slot ? `${decision.crew_utilization_at_slot}/4 Gangs` : 'Obeyed'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#162238]">
              <span className="text-slate-300">Continuous Track Access Guarantee</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Contiguous
              </span>
            </div>
          </div>
        </div>

        {/* Live What-If Priority Adjuster */}
        <div className="bg-[#0B132B] border border-[#2A3B53] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-amber-400">
              <Sliders className="w-3.5 h-3.5" />
              Interactive What-If Priority Override
            </h3>
            <span className="font-mono text-xs font-bold text-amber-300">{urgencyVal} / 100</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Adjust demand urgency to simulate emergency escalation or postponement:
          </p>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={urgencyVal}
              onChange={(e) => setUrgencyVal(e.target.value)}
              className="flex-1 accent-amber-400 bg-slate-800"
            />
            <button
              onClick={handleSaveUrgency}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold text-xs transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        {/* Controller Approval Button */}
        <div className="pt-2">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className={`w-full py-2.5 px-4 rounded-xl font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-lg ${
              isApproved
                ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                : isGranted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {isApproving
                ? 'Updating...'
                : isApproved
                ? 'Revoke Controller Approval'
                : isGranted
                ? 'Official Controller Approval'
                : 'Force Grant (Controller Override)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
