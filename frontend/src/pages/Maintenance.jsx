import React from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Sliders,
  CheckCircle,
  AlertOctagon,
  Wrench,
  Gauge,
  Thermometer,
  Zap,
  Download
} from 'lucide-react';

function Maintenance({ liveData, userRole }) {
  if (!liveData) {
    return <div className="text-center py-12 text-sm text-slate-400">Locking Diagnostic Feeds...</div>;
  }

  const { chiller, generator } = liveData.maintenance;

  // Mock standard maintenance checklists
  const chillerChecks = [
    { id: 1, task: "Inspect compressor lubricant oil viscosity", done: true },
    { id: 2, task: "Flush condenser coil mineral deposits", done: true },
    { id: 3, task: "Calibrate expansion valve expansion rates", done: false },
    { id: 4, task: "Audit motor vibration high-frequency harmonics", done: false }
  ];

  const generatorChecks = [
    { id: 1, task: "Verify fuel reserve levels (above 85%)", done: true },
    { id: 2, task: "Check battery cranking starter charge", done: true },
    { id: 3, task: "Inspect engine coolant levels & radiator hoses", done: true },
    { id: 4, task: "Log crankcase oil pressure logs", done: false }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Wrench className="text-clinical-500 animate-pulse-slow" />
            <span>Predictive Maintenance & Health Diagnostics</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Machine learning failure indicators analyzing mechanical stress factors, temperature shifts, and breakdown weights.
          </p>
        </div>

        <div className="flex gap-2">
          {/* CSV Exporter */}
          <a
            href={api.getReportExportUrl('maintenance')}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Download size={14} />
            <span>Download Audit Dataset</span>
          </a>
        </div>
      </div>

      {/* Breakdown Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Water Chiller Asset Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">Main Water Chiller</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Asset ID: CH-COM-01</span>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                chiller.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                chiller.status === 'Warning' ? 'bg-yellow-500/15 text-yellow-500 animate-pulse' : 'bg-red-500/20 text-red-400 glow-alarm'
              }`}>
                {chiller.status}
              </span>
            </div>

            {/* Live variables */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
              <div className="text-center bg-slate-100 dark:bg-slate-800/30 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Vibration</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{chiller.vibration} mm/s</span>
              </div>
              <div className="text-center bg-slate-100 dark:bg-slate-800/30 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Core Temp</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{chiller.temp}°C</span>
              </div>
              <div className="text-center bg-slate-100 dark:bg-slate-800/30 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Oil Press</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{chiller.oil} PSI</span>
              </div>
            </div>

            {/* Breakdown probability gauge */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Fail Probability (ML Model)</span>
                <p className="text-xs text-slate-400 mt-0.5">Logistic breakdown risk coefficient</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold ${chiller.failure_prob > 50 ? 'text-red-400' : 'text-emerald-500'}`}>
                  {chiller.failure_prob}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Generator Asset Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">Emergency Generator 1</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Asset ID: GEN-EM-01</span>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                generator.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/15 text-yellow-500 animate-pulse'
              }`}>
                {generator.status}
              </span>
            </div>

            {/* Live variables */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
              <div className="text-center bg-slate-100 dark:bg-slate-800/30 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Vibration</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{generator.vibration} mm/s</span>
              </div>
              <div className="text-center bg-slate-100 dark:bg-slate-800/30 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Core Temp</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{generator.temp}°C</span>
              </div>
              <div className="text-center bg-slate-100 dark:bg-slate-800/30 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Oil Press</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{generator.oil} PSI</span>
              </div>
            </div>

            {/* Breakdown probability gauge */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Fail Probability (ML Model)</span>
                <p className="text-xs text-slate-400 mt-0.5">Logistic breakdown risk coefficient</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-500">
                  {generator.failure_prob}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Task Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chiller Tasks */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold mb-4">Chiller Operational Checklist</h3>
          <div className="space-y-3">
            {chillerChecks.map(c => (
              <div key={c.id} className="flex items-start gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={c.done}
                  readOnly
                  className="mt-0.5 accent-clinical-500 bg-slate-200 border-none rounded cursor-default"
                />
                <span className={c.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>{c.task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generator Tasks */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold mb-4">Emergency Generator Checklist</h3>
          <div className="space-y-3">
            {generatorChecks.map(c => (
              <div key={c.id} className="flex items-start gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={c.done}
                  readOnly
                  className="mt-0.5 accent-clinical-500 bg-slate-200 border-none rounded cursor-default"
                />
                <span className={c.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>{c.task}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default Maintenance;
