import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Thermometer,
  ShieldAlert,
  Save,
  CheckCircle,
  HelpCircle,
  Wind,
  Flame,
  UserCheck
} from 'lucide-react';

function HvacOptimization({ liveData, userRole }) {
  const [setpoints, setSetpoints] = useState({});
  const [originalSetpoints, setOriginalSetpoints] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedWing, setSelectedWing] = useState(null);
  const [pendingValue, setPendingValue] = useState(null);

  // Load current target setpoints from database
  useEffect(() => {
    const fetchHvacSettings = async () => {
      try {
        const data = await api.getHvacSettings();
        setSetpoints(data);
        setOriginalSetpoints(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHvacSettings();
  }, []);

  if (!liveData || Object.keys(setpoints).length === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">Loading Clinical Setpoints...</div>;
  }

  // Handle local value changes
  const handleSetpointChange = (key, value) => {
    setSetpoints(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
  };

  // Safe checks & Commit updates
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      await api.setHvacSettings(setpoints);
      setOriginalSetpoints(setpoints);
      setMessage('Target clinical setpoints applied successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update setpoints.');
      setSetpoints(originalSetpoints); // rollback
    } finally {
      setSaving(false);
    }
  };

  // Open clinical shield warning before letting user adjust ICU/OT
  const handleTriggerSecurityOverride = (key, wingName, val) => {
    setSelectedWing({ key, name: wingName });
    setPendingValue(parseFloat(val));
    setShowWarningModal(true);
  };

  const confirmSecurityOverride = () => {
    if (selectedWing) {
      handleSetpointChange(selectedWing.key, pendingValue);
    }
    setShowWarningModal(false);
    setSelectedWing(null);
    setPendingValue(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
          <Thermometer className="text-clinical-500" />
          <span>Smart HVAC Optimization Module</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Monitor ward-level climate nodes, configure temperature boundaries, and enforce patient-safety thermal policies.
        </p>
      </div>

      {/* Clinical Safety Alert Banner */}
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-red-500/20 rounded-xl text-red-400">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">Clinical Safety Shield Active</h4>
          <p className="text-slate-300 text-xs mt-1 leading-relaxed">
            <strong>Critical Overrides Restricted</strong>: ICU temperature target is guarded strictly within clinical limits (20.0°C–23.0°C). Operating Theater (OT) setpoint must stay strictly within surgical parameters (18.0°C–22.0°C). remote changes outside these brackets will be rejected automatically by BEMS firmware.
          </p>
        </div>
      </div>

      {/* Main Grid: Wing Telemetries and Setpoint Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form: Setpoint Config */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1">
          <h3 className="text-base font-bold mb-4">Set Target Setpoints</h3>
          
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">{error}</div>}
          {message && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2"><CheckCircle size={14}/>{message}</div>}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            
            {/* ICU Setpoint */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 flex justify-between">
                <span>ICU TARGET SETPOINT</span>
                <span className="text-[10px] text-clinical-400 font-extrabold uppercase tracking-widest">Guarded Zone</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="20.0"
                  max="23.0"
                  value={setpoints.icu_target_temp}
                  onChange={(e) => handleSetpointChange('icu_target_temp', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-clinical-500 text-sm font-semibold"
                />
                <span className="flex items-center px-3 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-400 text-sm font-bold">°C</span>
              </div>
            </div>

            {/* OT Setpoint */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 flex justify-between">
                <span>SURGICAL OT SETPOINT</span>
                <span className="text-[10px] text-clinical-400 font-extrabold uppercase tracking-widest">Guarded Zone</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="18.0"
                  max="22.0"
                  value={setpoints.ot_target_temp}
                  onChange={(e) => handleSetpointChange('ot_target_temp', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-clinical-500 text-sm font-semibold"
                />
                <span className="flex items-center px-3 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-400 text-sm font-bold">°C</span>
              </div>
            </div>

            {/* General Wards */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">GENERAL WARDS SETPOINT</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="18.0"
                  max="28.0"
                  value={setpoints.wards_target_temp}
                  onChange={(e) => handleSetpointChange('wards_target_temp', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-clinical-500 text-sm font-semibold"
                />
                <span className="flex items-center px-3 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-400 text-sm font-bold">°C</span>
              </div>
            </div>

            {/* Outpatient */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">OUTPATIENT CLINIC SETPOINT</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="18.0"
                  max="28.0"
                  value={setpoints.outpatient_target_temp}
                  onChange={(e) => handleSetpointChange('outpatient_target_temp', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-clinical-500 text-sm font-semibold"
                />
                <span className="flex items-center px-3 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-400 text-sm font-bold">°C</span>
              </div>
            </div>

            {userRole === 'Technician' ? (
              <div className="p-3 bg-slate-800/40 rounded-xl text-slate-400 text-[10px] font-semibold text-center border border-slate-800">
                ADMIN OR MANAGER RIGHTS REQUIRED TO WRITE CHANGES
              </div>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-clinical-600 hover:bg-clinical-500 disabled:bg-slate-600 text-white font-bold rounded-xl transition-all duration-300 shadow-md text-sm flex items-center justify-center gap-2"
              >
                <Save size={16} />
                <span>{saving ? 'Updating Setpoints...' : 'Apply Operational Changes'}</span>
              </button>
            )}
          </form>
        </div>

        {/* Live Wards Map */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold">Live Clinical HVAC Nodes</h3>
          
          <div className="space-y-4">
            {Object.entries(liveData.wings).map(([name, w]) => {
              const setpointKey = name === "ICU" ? "icu_target_temp" :
                                 name === "OT" ? "ot_target_temp" :
                                 name === "General Wards" ? "wards_target_temp" :
                                 name === "Outpatient Clinic" ? "outpatient_target_temp" : "admin_target_temp";
              
              const currentTarget = setpoints[setpointKey];
              const tempDiff = Math.abs(w.temp - currentTarget);
              
              return (
                <div key={name} className="p-4 bg-slate-100 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>{name}</span>
                      {name === "ICU" || name === "OT" ? (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-clinical-500/10 text-clinical-400 border border-clinical-500/20 rounded-md">Safety Locked</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-slate-200 dark:bg-slate-800/60 text-slate-400 rounded-md">General Area</span>
                      )}
                    </h4>
                    
                    <div className="flex gap-4 mt-2 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1"><UserCheck size={12}/>{w.occupancy} occupants</span>
                      <span className="flex items-center gap-1"><Wind size={12}/>HVAC: {w.hvac === 2 ? 'Comfort (High)' : (w.hvac === 1 ? 'ECO (Low)' : 'OFF')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">LIVE TEMP</span>
                      <span className={`text-lg font-extrabold ${tempDiff > 1.5 ? 'text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{w.temp}°C</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">SETPOINT</span>
                      <span className="text-lg font-extrabold text-clinical-400">{currentTarget ? `${currentTarget}°C` : '--'}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">POWER LOG</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{w.power} kW</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Warning Override Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-red-500/30 text-white rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert size={24} />
              <h3 className="text-lg font-bold">Clinical Override Confirmed</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              WARNING: You are adjusting the target temperature setpoint in the **{selectedWing?.name}**. Thermal drift in operational theatres or clinical treatment suites directly impacts surgical settings. 
            </p>
            <div className="flex justify-end gap-3 text-sm">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSecurityOverride}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-md font-bold"
              >
                Acknowledge & Set
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default HvacOptimization;
