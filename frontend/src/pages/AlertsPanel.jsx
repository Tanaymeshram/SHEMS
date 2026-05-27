import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Filter,
  CheckSquare
} from 'lucide-react';

function AlertsPanel({ alerts, onResolveAlert }) {
  const [filterType, setFilterType] = useState('All'); // All, Unresolved, Resolved, Critical, Warning

  const handleResolveClick = (id) => {
    onResolveAlert(id);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'All') return true;
    if (filterType === 'Unresolved') return !a.resolved;
    if (filterType === 'Resolved') return a.resolved;
    if (filterType === 'Critical') return a.type === 'Critical';
    if (filterType === 'Warning') return a.type === 'Warning';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Bell className="text-red-500 animate-bounce" />
            <span>Alerts & Notifications System</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Real-time critical alarms, energy leakage anomalies, and mechanical failure warning logs.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="All">All Audit Logs</option>
            <option value="Unresolved">Active Alarms</option>
            <option value="Resolved">Cleared Events</option>
            <option value="Critical">Critical Severity</option>
            <option value="Warning">Warning Level</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <CheckCircle size={36} className="mx-auto text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Alert Buffer Clear</h4>
            <p className="text-xs">All monitored microgrid loops operating inside standard ranges.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                  alert.resolved
                    ? 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-200 dark:border-slate-800/40 opacity-60'
                    : alert.type === 'Critical'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    alert.resolved ? 'bg-slate-200 dark:bg-slate-850 text-slate-400' :
                    alert.type === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">{alert.source}</span>
                      <span className="text-[9px] opacity-60 flex items-center gap-1"><Clock size={10}/>{alert.timestamp}</span>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed text-slate-800 dark:text-slate-100 font-semibold">
                      {alert.message}
                    </p>
                  </div>
                </div>

                {/* Resolve Action Panel */}
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800/80">
                  {alert.resolved ? (
                    <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                      <CheckSquare size={12}/>
                      <span>Cleared</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveClick(alert.id)}
                      className="px-3 py-1.5 bg-clinical-600 hover:bg-clinical-500 hover:text-white text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle size={12} />
                      <span>Clear Alert</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

export default AlertsPanel;
