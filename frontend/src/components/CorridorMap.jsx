import React, { useState } from 'react';
import { MapPin, Activity, ShieldAlert, Wrench, Train, Gauge } from 'lucide-react';

export default function CorridorMap({ stations, sections, requests, onSelectSection }) {
  const [selectedSecId, setSelectedSecId] = useState(sections[0]?.section_id || 'SEC_TDL_ETW');

  // Count active/granted maintenance blocks per section
  const sectionBlockCounts = React.useMemo(() => {
    const counts = {};
    requests.forEach((r) => {
      if (r.status === 'GRANTED' || r.status === 'APPROVED') {
        counts[r.section_id] = (counts[r.section_id] || 0) + 1;
      }
    });
    return counts;
  }, [requests]);

  const selectedSec = sections.find((s) => s.section_id === selectedSecId) || sections[0];
  const secDemands = requests.filter((r) => r.section_id === selectedSecId);

  return (
    <div className="space-y-6">
      {/* Schematic Linear Topology Track */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Train className="w-5 h-5 text-cyan-400" />
              <span>Corridor Track Topology Schematic (NDLS - DDU Main Trunk)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive high-density trunk line showing real-time asset degradation & granted block allocations
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal (&lt;60)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (60-79)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Critical (≥80)
            </span>
          </div>
        </div>

        {/* Horizontal Track Ribbon */}
        <div className="overflow-x-auto pb-4 pt-6">
          <div className="min-w-[950px] relative px-6">
            {/* Main Track Rails */}
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#2A3B53] -translate-y-1.5 z-0"></div>
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#2A3B53] translate-y-1.5 z-0"></div>

            <div className="flex items-center justify-between relative z-10">
              {stations.map((stn, idx) => (
                <div key={stn.code} className="flex flex-col items-center group cursor-pointer">
                  {/* Station Node */}
                  <div className="w-9 h-9 rounded-xl bg-[#0B132B] border-2 border-cyan-400 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs shadow-lg group-hover:scale-110 group-hover:border-cyan-300 transition-all">
                    {stn.code}
                  </div>
                  {/* Station Info */}
                  <div className="mt-2 text-center">
                    <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                      {stn.name.split(' ')[0]}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">{stn.km_mark} km</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Track Sections List Selector */}
        <div className="mt-6 pt-6 border-t border-[#2A3B53] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {sections.map((sec) => {
            const isSelected = sec.section_id === selectedSecId;
            const blockCount = sectionBlockCounts[sec.section_id] || 0;
            const riskColor =
              sec.risk_score >= 80
                ? 'border-rose-500/60 text-rose-300 bg-rose-950/30'
                : sec.risk_score >= 60
                ? 'border-amber-500/60 text-amber-300 bg-amber-950/30'
                : 'border-emerald-500/60 text-emerald-300 bg-emerald-950/30';

            return (
              <button
                key={sec.section_id}
                onClick={() => {
                  setSelectedSecId(sec.section_id);
                  if (onSelectSection) onSelectSection(sec.section_id);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${riskColor} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.02] shadow-lg' : 'hover:brightness-125'
                }`}
              >
                <div className="font-bold font-mono text-xs truncate" title={sec.name}>
                  {sec.from_station} ↔ {sec.to_station}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                  <span>Risk: {sec.risk_score}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#0B132B] text-cyan-300 text-[10px]">
                    {blockCount} Blocks
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Section Deep-Dive Card */}
      {selectedSec && (
        <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#2A3B53] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{selectedSec.name}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedSec.section_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Length: {selectedSec.length_km} km • Max Speed: {selectedSec.max_speed_kmph} km/h • Capacity: {selectedSec.capacity_trains_per_hour} trains/hr
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0B132B] border border-[#2A3B53] font-mono text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Composite Asset Risk</span>
                <span
                  className={`text-xl font-bold ${
                    selectedSec.risk_score >= 80
                      ? 'text-rose-400'
                      : selectedSec.risk_score >= 60
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {selectedSec.risk_score} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Health Metrics & Demand Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* P-Way Track Health */}
            <div className="p-3.5 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">P-Way (Track Geometry)</span>
                <span className="text-emerald-400 font-bold">{selectedSec.pway_health}%</span>
              </div>
              <div className="w-full bg-[#162238] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${selectedSec.pway_health}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Rail wear index & sleeper condition</span>
            </div>

            {/* OHE Electrical Health */}
            <div className="p-3.5 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">TRD (OHE Traction Wire)</span>
                <span className="text-amber-400 font-bold">{selectedSec.ohe_health}%</span>
              </div>
              <div className="w-full bg-[#162238] h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${selectedSec.ohe_health}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Catenary tension & isolator age</span>
            </div>

            {/* Signaling Health */}
            <div className="p-3.5 rounded-lg bg-[#0B132B] border border-[#2A3B53]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">S&T (Interlocking & Circuits)</span>
                <span className="text-indigo-400 font-bold">{selectedSec.signal_health}%</span>
              </div>
              <div className="w-full bg-[#162238] h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${selectedSec.signal_health}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Axle counter & point machine status</span>
            </div>
          </div>

          {/* Demands on this section */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2.5">
              Demands Assigned to {selectedSec.section_id} ({secDemands.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {secDemands.map((req) => (
                <div
                  key={req.id}
                  className={`p-2.5 rounded-lg border ${
                    req.status === 'GRANTED' || req.status === 'APPROVED'
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">{req.id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        req.status === 'GRANTED' || req.status === 'APPROVED'
                          ? 'bg-emerald-900 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 truncate">{req.work_type}</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-1">
                    Duration: {req.duration_hours}h • Urgency: {req.urgency_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
