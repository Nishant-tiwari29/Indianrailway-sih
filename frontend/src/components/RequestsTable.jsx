import React, { useState } from 'react';
import { Search, Filter, CheckCircle, AlertOctagon, Shield, Clock, Hammer, Zap, Radio, Wrench } from 'lucide-react';
import { approveBlockRequest } from '../api';

const DEPT_ICONS = {
  ENGINEERING: Hammer,
  TRD_ELECTRICAL: Zap,
  SIGNAL_TELECOM: Radio,
  MECHANICAL: Wrench,
};

export default function RequestsTable({ requests, onSelectRequest, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.work_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.section_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'GRANTED'
        ? r.status === 'GRANTED' || r.status === 'APPROVED'
        : r.status === statusFilter;

    const matchesDept = deptFilter === 'ALL' ? true : r.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleToggleApprove = async (reqId, currentApproved) => {
    try {
      await approveBlockRequest(reqId, !currentApproved);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error toggling approval:", err);
    }
  };

  return (
    <div className="bg-[#162238] border border-[#2A3B53] rounded-xl shadow-xl overflow-hidden">
      {/* Table Filters Header */}
      <div className="p-4 border-b border-[#2A3B53] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#1C2541]/40">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search demands, sections, works..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0B132B] border border-[#2A3B53] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0B132B] border border-[#2A3B53] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="GRANTED">Granted / Approved</option>
            <option value="REJECTED">Deferred / Rejected</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-[#0B132B] border border-[#2A3B53] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Departments</option>
            <option value="ENGINEERING">Civil (P-Way)</option>
            <option value="TRD_ELECTRICAL">TRD (Electrical)</option>
            <option value="SIGNAL_TELECOM">Signal & Telecom</option>
            <option value="MECHANICAL">Mechanical / Bridge</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredRequests.length}</span> of {requests.length} Demands
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#0B132B] border-b border-[#2A3B53] font-mono text-[11px] text-slate-400">
              <th className="p-3">Demand ID</th>
              <th className="p-3">Department</th>
              <th className="p-3">Track Section</th>
              <th className="p-3">Work Scope</th>
              <th className="p-3 text-center">Duration</th>
              <th className="p-3 text-center">Urgency</th>
              <th className="p-3">Scheduled Slot</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => {
              const Icon = DEPT_ICONS[req.department] || Hammer;
              const isGranted = req.status === 'GRANTED' || req.status === 'APPROVED';
              const isApproved = req.status === 'APPROVED' || req.approved_by_controller;

              return (
                <tr
                  key={req.id}
                  className="border-b border-[#2A3B53]/60 hover:bg-[#1C2541]/40 transition-colors cursor-pointer"
                  onClick={() => onSelectRequest(req)}
                >
                  <td className="p-3 font-mono font-bold text-cyan-300">{req.id}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.department.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{req.section_id}</td>
                  <td className="p-3 text-white font-medium max-w-xs truncate" title={req.work_type}>
                    {req.work_type}
                  </td>
                  <td className="p-3 text-center font-mono">{req.duration_hours}h</td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        req.urgency_score >= 80
                          ? 'text-rose-400 bg-rose-950/60 border border-rose-800'
                          : req.urgency_score >= 60
                          ? 'text-amber-400 bg-amber-950/60 border border-amber-800'
                          : 'text-slate-300 bg-slate-900 border border-slate-800'
                      }`}
                    >
                      {req.urgency_score}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {req.assigned_slots
                      ? `${req.assigned_slots[0].toString().padStart(2, '0')}:00 - ${(
                          req.assigned_slots[req.assigned_slots.length - 1] + 1
                        )
                          .toString()
                          .padStart(2, '0')}:00`
                      : '—'}
                  </td>
                  <td className="p-3 text-center font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isApproved
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : isGranted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isApproved ? 'APPROVED' : req.status}
                    </span>
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleApprove(req.id, isApproved)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium font-mono transition-colors ${
                        isApproved
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
                          : isGranted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isApproved ? 'Revoke' : 'Approve'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
