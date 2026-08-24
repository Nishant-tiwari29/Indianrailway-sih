import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line
} from 'recharts';
import { BarChart3, Users, ShieldCheck, Activity } from 'lucide-react';

export default function AnalyticsCharts({ kpiData }) {
  if (!kpiData) return null;

  const { department_breakdown, section_profiles, hourly_crew_load } = kpiData;

  // Prepare Department Chart Data
  const deptData = Object.entries(department_breakdown || {}).map(([key, d]) => ({
    name: d.name.split(' ')[0],
    fullName: d.name,
    Demands: d.total,
    Granted: d.granted,
    Hours: d.hours_granted,
    GrantRate: d.grant_rate,
  }));

  // Prepare Hourly Crew Load Data
  const crewData = (hourly_crew_load || []).map((load, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    ActiveGangs: load,
    CapacityLimit: 4,
  }));

  // Prepare Section Risk Mitigation Data
  const riskData = (section_profiles || []).map((s) => ({
    section: s.section_id.replace('SEC_', ''),
    CurrentRisk: s.current_risk,
    ProjectedRisk: s.projected_risk,
    MitigationGain: Math.max(0, s.current_risk - s.projected_risk),
  }));

  return (
    <div className="space-y-6">
      {/* 1. Department Breakdown & Hourly Crew Load */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Demands vs Grants */}
        <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Departmental Demands vs Grants</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Block requests received vs successfully scheduled by CP-SAT
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3B53" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#2A3B53', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Demands" fill="#3A506B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Granted" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24h Hourly Crew Utilization */}
        <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Hourly Network Crew Load vs 4-Gang Cap</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simultaneous maintenance gangs active across 24-hour horizon
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="crewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3B53" opacity={0.5} />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={10} interval={3} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#2A3B53', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="ActiveGangs" stroke="#6366F1" fillOpacity={1} fill="url(#crewGradient)" />
                <Line type="step" dataKey="CapacityLimit" stroke="#EF4444" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Track Section Asset Risk Comparison */}
      <div className="bg-[#162238] border border-[#2A3B53] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Asset Risk Mitigation by Section (Pre vs Post Maintenance)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated risk reduction achieved by scheduling high-priority track and electrical maintenance
            </p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3B53" opacity={0.5} />
              <XAxis dataKey="section" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#2A3B53', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="CurrentRisk" fill="#EF4444" radius={[4, 4, 0, 0]} name="Baseline Risk" />
              <Bar dataKey="ProjectedRisk" fill="#10B981" radius={[4, 4, 0, 0]} name="Post-Block Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
