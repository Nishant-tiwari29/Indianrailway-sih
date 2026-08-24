import React, { useState } from 'react';
import { X, PlusCircle, Hammer, Zap, Radio, Wrench } from 'lucide-react';
import { createBlockRequest } from '../api';

export default function AddRequestModal({ isOpen, onClose, sections, onDemandAdded }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    id: `REQ-EMERG-${Math.floor(100 + Math.random() * 900)}`,
    section_id: sections[0]?.section_id || 'SEC_TDL_ETW',
    department: 'ENGINEERING',
    work_type: 'Emergency Rail Joint Rehabilitation',
    duration_hours: 3,
    urgency_score: 95.0,
    preferred_start_window: [1, 6],
    machine_type: 'Emergency Gang & Tensor',
    block_type: 'TRAFFIC_BLOCK',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await createBlockRequest({
        ...formData,
        duration_hours: parseInt(formData.duration_hours),
        urgency_score: parseFloat(formData.urgency_score),
      });
      if (onDemandAdded) onDemandAdded();
      onClose();
    } catch (err) {
      console.error("Error creating block demand:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#162238] border border-[#2A3B53] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#2A3B53] flex items-center justify-between bg-[#1C2541]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit New Block Demand</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register a maintenance access request for AI scheduling
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Section & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Track Section</label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#2A3B53] rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {sections.map((sec) => (
                  <option key={sec.section_id} value={sec.section_id}>
                    {sec.name} ({sec.section_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Requesting Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#2A3B53] rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ENGINEERING">Civil / P-Way (Track)</option>
                <option value="TRD_ELECTRICAL">TRD (OHE Electrical)</option>
                <option value="SIGNAL_TELECOM">Signal & Telecom (S&T)</option>
                <option value="MECHANICAL">Mechanical / Bridge</option>
              </select>
            </div>
          </div>

          {/* Work Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Work Description / Machine Required</label>
            <input
              type="text"
              value={formData.work_type}
              onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
              required
              className="w-full bg-[#0B132B] border border-[#2A3B53] rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Duration & Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Duration Required (Hours)</label>
              <select
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#2A3B53] rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="3">3 Hours</option>
                <option value="4">4 Hours</option>
                <option value="5">5 Hours</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between">
                <label className="block text-slate-300 font-medium mb-1">Urgency Score</label>
                <span className="font-mono font-bold text-amber-400">{formData.urgency_score} / 100</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={formData.urgency_score}
                onChange={(e) => setFormData({ ...formData, urgency_score: e.target.value })}
                className="w-full accent-amber-400 bg-slate-800"
              />
            </div>
          </div>

          {/* Preferred Time Window */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Preferred Time Window</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.preferred_start_window[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferred_start_window: [parseInt(e.target.value), formData.preferred_start_window[1]],
                  })
                }
                className="bg-[#0B132B] border border-[#2A3B53] rounded-lg p-2 text-slate-200 font-mono text-xs"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    Earliest: {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>

              <select
                value={formData.preferred_start_window[1]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferred_start_window: [formData.preferred_start_window[0], parseInt(e.target.value)],
                  })
                }
                className="bg-[#0B132B] border border-[#2A3B53] rounded-lg p-2 text-slate-200 font-mono text-xs"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    Latest: {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Register Demand & Queue for AI Solver'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
