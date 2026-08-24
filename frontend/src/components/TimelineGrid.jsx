import React, { useState } from 'react';
import { ShieldAlert, Info, Wrench, Zap, Radio, Hammer, CheckCircle, Clock } from 'lucide-react';

const DEPT_CONFIG = {
  ENGINEERING: {
    name: 'Civil (P-Way)',
    bg: 'bg-emerald-600',
    border: 'border-emerald-400',
    text: 'text-emerald-100',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    icon: Hammer,
  },
  TRD_ELECTRICAL: {
    name: 'TRD (Electrical)',
    bg: 'bg-amber-600',
    border: 'border-amber-400',
    text: 'text-amber-100',
    badge: 'bg-amber-950 text-amber-300 border-amber-800',
    icon: Zap,
  },
  SIGNAL_TELECOM: {
    name: 'Signal & Telecom',
    bg: 'bg-indigo-600',
    border: 'border-indigo-400',
    text: 'text-indigo-100',
    badge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    icon: Radio,
  },
  MECHANICAL: {
    name: 'Mechanical / Bridge',
    bg: 'bg-pink-600',
    border: 'border-pink-400',
    text: 'text-pink-100',
    badge: 'bg-pink-950 text-pink-300 border-pink-800',
    icon: Wrench,
  },
};

export default function TimelineGrid({
  sections,
  requests,
  timelineGrid,
  trains,
  onSelectRequest,
  selectedRequestId,
  hourlyCrewLoad
}) {
  const [filterDept, setFilterDept] = useState('ALL');
  const reqMap = React.useMemo(() => {
    const map = {};
    requests.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [requests]);

  // Precompute must-run train positions per (section_id, slot)
  const mustRunMap = React.useMemo(() => {
    const map = {};
    trains.forEach((t) => {
      if (t.is_must_run) {
        Object.entries(t.section_slots).forEach(([secId, slots]) => {
          slots.forEach((slot) => {
            const key = `${secId}_${slot}`;
            if (!map[key]) map[key] = [];
            map[key].push(t);
          });
        });
      }
    });
    return map;
  }, [trains]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-[#162238] border border-[#2A3B53] rounded-xl shadow-xl overflow-hidden mb-6">
      {/* Timeline Controls & Legend */}
      <div className="p-4 border-b border-[#2A3B53] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#1C2541]/40">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Corridor Master Schedule (24-Hour Horizon)</h2>
          <span className="text-xs text-slate-400 font-mono">00:00 - 23:59 Hrs</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Departments:</span>
          {Object.entries(DEPT_CONFIG).map(([deptKey, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={deptKey}
                onClick={() => setFilterDept(filterDept === deptKey ? 'ALL' : deptKey)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all text-[11px] ${
                  filterDept === deptKey || filterDept === 'ALL'
                    ? `${cfg.badge} border font-medium`
                    : 'opacity-40 bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cfg.name}</span>
              </button>
            );
          })}

          <div className="inline-flex items-center gap-1 text-rose-400 font-mono text-[11px] pl-2 border-l border-[#2A3B53]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Must-Run Train Window</span>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[1100px]">
          <thead>
            <tr className="bg-[#0B132B] border-b border-[#2A3B53] text-[11px] font-mono text-slate-400">
              <th className="p-3 w-64 sticky left-0 z-20 bg-[#0B132B] border-r border-[#2A3B53]">
                Track Section & Asset Health
              </th>
              {hours.map((h) => (
                <th
                  key={h}
                  className={`p-2 text-center border-r border-[#2A3B53]/60 min-w-[42px] ${
                    h >= 1 && h <= 5 ? 'bg-indigo-950/20 text-cyan-300' : ''
                  }`}
                >
                  <div className="font-semibold">{`${h.toString().padStart(2, '0')}:00`}</div>
                  <div className="text-[9px] text-slate-500 font-normal">
                    {h >= 1 && h <= 5 ? '🌙 Valley' : (h >= 8 && h <= 11) || (h >= 17 && h <= 20) ? '⚡ Peak' : ''}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((sec) => {
              const secSlots = timelineGrid[sec.section_id] || Array(24).fill(null);

              return (
                <tr key={sec.section_id} className="border-b border-[#2A3B53]/60 hover:bg-[#1C2541]/30 transition-colors">
                  {/* Section Details Header */}
                  <td className="p-3 sticky left-0 z-10 bg-[#162238] border-r border-[#2A3B53] text-xs">
                    <div className="font-semibold text-white truncate max-w-[230px]" title={sec.name}>
                      {sec.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                      <span className="text-slate-400">{sec.length_km} km</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{sec.max_speed_kmph} km/h</span>
                      <span className="text-slate-600">•</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          sec.risk_score >= 80
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : sec.risk_score >= 60
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                        title="Composite Asset Risk Score (0-100)"
                      >
                        Risk {sec.risk_score}
                      </span>
                    </div>
                  </td>

                  {/* 24 Time Slot Cells */}
                  {hours.map((slot) => {
                    const reqId = secSlots[slot];
                    const req = reqId ? reqMap[reqId] : null;
                    const mustRuns = mustRunMap[`${sec.section_id}_${slot}`];

                    // Check if block starts at this slot (for continuous block pill rendering)
                    const isBlockStart = req && req.assigned_slots && req.assigned_slots[0] === slot;
                    const isInsideBlock = req && req.assigned_slots && req.assigned_slots.includes(slot);

                    const deptStyle = req ? DEPT_CONFIG[req.department] || DEPT_CONFIG.ENGINEERING : null;
                    const isSelected = req && req.id === selectedRequestId;
                    const isFilteredOut = filterDept !== 'ALL' && req && req.department !== filterDept;

                    return (
                      <td
                        key={slot}
                        className={`p-1 border-r border-[#2A3B53]/40 relative text-center text-xs h-14 ${
                          slot >= 1 && slot <= 5 ? 'bg-indigo-950/10' : ''
                        }`}
                      >
                        {/* Must-Run Train Indicator */}
                        {mustRuns && mustRuns.length > 0 && !isInsideBlock && (
                          <div
                            className="absolute inset-1 rounded bg-rose-950/40 border border-rose-800/40 flex items-center justify-center cursor-help group z-0"
                            title={`Must-Run Train Active: ${mustRuns.map((t) => t.train_name).join(', ')}`}
                          >
                            <span className="text-[10px] font-mono text-rose-400 font-bold opacity-80">
                              🚆 {mustRuns[0].train_number}
                            </span>
                          </div>
                        )}

                        {/* Granted Maintenance Block */}
                        {isInsideBlock && !isFilteredOut && (
                          <button
                            onClick={() => onSelectRequest(req)}
                            className={`w-full h-full rounded flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-md ${
                              deptStyle.bg
                            } ${
                              isSelected
                                ? 'ring-2 ring-white scale-95 shadow-lg'
                                : 'hover:brightness-110 hover:scale-[0.98]'
                            }`}
                            title={`Click to inspect AI reasoning for ${req.id} (${req.work_type})`}
                          >
                            <span className="font-mono font-bold text-[10px] text-white tracking-tight truncate max-w-full">
                              {isBlockStart ? req.id : '•'}
                            </span>
                            {isBlockStart && (
                              <span className="text-[9px] text-white/90 truncate max-w-full font-medium leading-none mt-0.5">
                                {req.work_type.split(' ')[0]}
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Crew Utilization Footer Row */}
            <tr className="bg-[#0B132B] border-t-2 border-[#2A3B53] font-mono text-[11px]">
              <td className="p-3 sticky left-0 z-20 bg-[#0B132B] border-r border-[#2A3B53] text-slate-300 font-semibold">
                Network Crew Load (Gangs Active)
              </td>
              {hours.map((h) => {
                const load = hourlyCrewLoad ? hourlyCrewLoad[h] : 0;
                return (
                  <td key={h} className="p-2 text-center border-r border-[#2A3B53]/40">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        load >= 4
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : load > 0
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'text-slate-600'
                      }`}
                    >
                      {load} / 4
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
