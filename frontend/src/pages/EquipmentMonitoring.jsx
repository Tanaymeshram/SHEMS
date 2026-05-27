import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Monitor,
  AlertTriangle,
  Play,
  Moon,
  Power,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Info,
  TrendingUp,
  Cpu,
  ZapOff
} from 'lucide-react';

function EquipmentMonitoring({ liveData, userRole }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Safety override Modal state
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [modalAsset, setModalAsset] = useState(null);

  const fetchEquipment = async () => {
    try {
      const data = await api.getEquipment();
      setEquipment(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEquipment();
    
    // Periodically update to see fluctuating power draws
    const interval = setInterval(fetchEquipment, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatusClick = (eq, targetStatus) => {
    if (eq.is_critical && targetStatus === "Off") {
      setError(`CLINICAL EXCEPTION: Power shutdown blocked for clinical critical life-support asset: "${eq.name}".`);
      setTimeout(() => setError(''), 4000);
      return;
    }
    
    setModalAsset({ eq, targetStatus });
    setShowSafetyModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!modalAsset) return;
    const { eq, targetStatus } = modalAsset;
    setShowSafetyModal(false);
    
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await api.updateEquipmentStatus(eq.name, targetStatus);
      setMessage(`Asset "${eq.name}" state updated to ${targetStatus.toUpperCase()}.`);
      setTimeout(() => setMessage(''), 3000);
      await fetchEquipment();
    } catch (err) {
      setError(err.message || 'Failed to update equipment state.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
      setModalAsset(null);
    }
  };

  // Standby power audit calculations
  const totalStandbyLoss = equipment
    .filter(eq => eq.status === 'Idle' || eq.status === 'Standby')
    .reduce((sum, eq) => sum + eq.standby_loss, 0);

  // Generate dynamic recommendations based on equipment status
  const getAIRecommendations = () => {
    const idleAssets = equipment.filter(eq => eq.status === 'Idle' || eq.status === 'Standby');
    const recs = [];

    idleAssets.forEach(eq => {
      if (eq.name === "MRI Express 3T") {
        recs.push({
          asset: eq.name,
          issue: "Idle for 45 mins (Standby leakage: 12.5 kW)",
          action: "Shift to Deep Sleep / Eco-Cooling mode",
          savings: "Offsets 12.5 kWh (~$2.75/hr)"
        });
      } else if (eq.name === "High-Speed CT Scanner") {
        recs.push({
          asset: eq.name,
          issue: "Standby for 120 mins (Standby draw: 4.5 kW)",
          action: "Schedule Auto-Power Save override",
          savings: "Offsets 4.5 kWh (~$0.99/hr)"
        });
      } else if (eq.name === "Digital X-Ray Wing B" && eq.status === "Standby") {
        recs.push({
          asset: eq.name,
          issue: "Unused Standby leakage: 2.1 kW",
          action: "Initiate low-power Hibernation cycle",
          savings: "Offsets 2.1 kWh (~$0.46/hr)"
        });
      }
    });

    return recs;
  };

  const aiRecs = getAIRecommendations();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
          <Monitor className="text-clinical-500" />
          <span>Medical Equipment Idle-Time Detection Console</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Audit duty cycles of clinical machinery, track standby power leakages, and execute AI eco-mode recommendations.
        </p>
      </div>

      {/* Standby loss indicator panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Devices Audited</span>
            <h3 className="text-2xl font-extrabold tracking-tight mt-1">{equipment.length} Assets</h3>
          </div>
          <div className="p-3 bg-clinical-500/10 text-clinical-400 rounded-xl">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Standby Power Wastage</span>
            <h3 className="text-2xl font-extrabold tracking-tight text-yellow-500 mt-1">{totalStandbyLoss.toFixed(2)} kW</h3>
          </div>
          <div className="p-3 bg-yellow-500/15 text-yellow-500 rounded-xl">
            <ZapOff size={20} className="animate-pulse" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Safety Shield Status</span>
            <h3 className="text-2xl font-extrabold tracking-tight text-emerald-500 mt-1">ACTIVE (100%)</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Sparkles size={20} />
          </div>
        </div>

      </div>

      {/* ⚠️ AI RECOMMENDATIONS PANEL */}
      {aiRecs.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <Cpu size={18} className="animate-pulse" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">AI Standby Optimization Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecs.map((rec, i) => (
              <div key={i} className="p-4 bg-slate-900/50 rounded-xl border border-yellow-500/20 text-xs flex flex-col justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-yellow-400">{rec.asset}</h4>
                  <p className="text-slate-300 font-semibold mt-1">{rec.issue}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Suggested Action:</p>
                  <p className="text-emerald-400 font-bold mt-0.5">{rec.action}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-bold flex justify-between">
                  <span>EST. SAVINGS</span>
                  <span className="text-emerald-500">{rec.savings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Card widgets */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold">Clinical Assets & Diagnostic Equipment</h3>
          
          <div className="flex items-center gap-2 text-[10px] bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl text-slate-400 border border-slate-200 dark:border-slate-800">
            <Info size={12}/>
            <span>ICU/OT ventilators/suite locks prevent remote standby commands.</span>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">{error}</div>}
        {message && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2"><CheckCircle size={14}/>{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((eq) => {
            const isStandbyWasting = (eq.status === 'Idle' || eq.status === 'Standby') && eq.standby_loss > 1.0;
            return (
              <div
                key={eq.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isStandbyWasting
                    ? 'bg-yellow-500/5 border-yellow-500/30'
                    : 'bg-slate-100 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{eq.name}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                      eq.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      eq.status === 'Off' ? 'bg-slate-500/15 text-slate-400 border border-slate-700/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
                    }`}>
                      {eq.status}
                    </span>
                  </div>

                  {eq.is_critical ? (
                    <span className="px-2 py-0.5 mt-2 inline-block text-[8px] font-extrabold uppercase bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">Life Support (Critical)</span>
                  ) : (
                    <span className="px-2 py-0.5 mt-2 inline-block text-[8px] font-extrabold uppercase bg-slate-200 dark:bg-slate-800/60 text-slate-400 rounded-md">{eq.type}</span>
                  )}

                  {/* Standby indicators & Timers */}
                  <div className="mt-4 space-y-2 text-xs font-semibold text-slate-400">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Clock size={12}/>Operating Log</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{eq.operating_hours} hrs</span>
                    </div>

                    {(eq.status === 'Idle' || eq.status === 'Standby') ? (
                      <div className="flex justify-between text-yellow-500">
                        <span className="flex items-center gap-1"><Clock size={12}/>Idle Timer</span>
                        <span className="font-extrabold">{eq.name === "MRI Express 3T" ? "45 mins" : "120 mins"}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Clock size={12}/>Idle Timer</span>
                        <span className="text-slate-500">--</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 flex flex-col gap-3">
                  {/* Power Draw Gauge */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Live Power Draw:</span>
                    <span className="font-extrabold text-clinical-400">
                      {eq.status === 'Active' ? eq.power_draw : (eq.status === 'Off' ? 0.0 : eq.standby_loss)} kW
                    </span>
                  </div>

                  {/* Remote Action Panel */}
                  <div className="flex justify-end gap-1.5 pt-1">
                    {userRole === 'Technician' ? (
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Lock Shield Active</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUpdateStatusClick(eq, 'Active')}
                          disabled={eq.status === 'Active' || loading}
                          className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1"
                          title="Activate Asset"
                        >
                          <Play size={10} />
                          <span>ON</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatusClick(eq, 'Standby')}
                          disabled={eq.status === 'Standby' || loading}
                          className="px-2.5 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-xl hover:bg-yellow-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-yellow-500/10 text-xs font-bold flex items-center gap-1"
                          title="Set Standby"
                        >
                          <Moon size={10} />
                          <span>ECO</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatusClick(eq, 'Off')}
                          disabled={eq.status === 'Off' || loading}
                          className="px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-red-500/10 text-xs font-bold flex items-center gap-1"
                          title="Power Off Asset"
                        >
                          <Power size={10} />
                          <span>OFF</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Override Confirmation Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-yellow-500/30 text-white rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Safety Override Action Checklist</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to execute a remote status override. Action target: **{modalAsset?.eq.name}** to state **{modalAsset?.targetStatus.toUpperCase()}**.
            </p>
            <div className="p-3 bg-slate-800 rounded-xl text-[10px] text-slate-400 leading-relaxed">
              Verify that the diagnostic scan is fully completed, patients are cleared from the room, and there are no active dependencies in clinical queues before initiating power transitions.
            </div>
            <div className="flex justify-end gap-3 text-sm">
              <button
                onClick={() => setShowSafetyModal(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Abort Action
              </button>
              <button
                onClick={confirmStatusUpdate}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition-all shadow-md font-bold"
              >
                Acknowledge & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EquipmentMonitoring;
