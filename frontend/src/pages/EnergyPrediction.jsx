import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  DollarSign,
  AlertOctagon,
  Sliders,
  ChevronRight,
  RefreshCw,
  Download
} from 'lucide-react';

function EnergyPrediction({ liveData }) {
  const [outdoorTemp, setOutdoorTemp] = useState(24.0);
  const [predictionsData, setPredictionsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await api.getEnergyPredictions(outdoorTemp);
      setPredictionsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [outdoorTemp]);

  if (!predictionsData) {
    return <div className="text-center py-12 text-sm text-slate-400">Loading Forecasting Models...</div>;
  }

  const { predictions_24h, metrics } = predictionsData;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <TrendingUp className="text-clinical-500" />
            <span>Predictive Energy Consumption Analytics</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Machine learning time-series projections forecasting loads, pricing curves, and cost impact.
          </p>
        </div>

        <div className="flex gap-2">
          {/* CSV Exporter */}
          <a
            href={api.getReportExportUrl('energy')}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Download size={14} />
            <span>Download Audit Dataset</span>
          </a>
        </div>
      </div>

      {/* Weather Variable Slider & ML Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Variables Slider */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sliders size={16} className="text-clinical-400" />
            <span>Forecasting Ambient Conditions</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Drag the outdoor temp slider to recalculate thermodynamic cooling predictions. BEMS utilizes these models to forecast hospital HVAC chillers.
          </p>

          <div className="py-2">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>OUTDOOR TEMP SPEC</span>
              <span className="text-clinical-400">{outdoorTemp}°C</span>
            </div>
            <input
              type="range"
              min="16"
              max="38"
              step="0.5"
              value={outdoorTemp}
              onChange={(e) => setOutdoorTemp(parseFloat(e.target.value))}
              className="w-full accent-clinical-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
              <span>COOL SPRING (16°C)</span>
              <span>PEAK SUMMER (38°C)</span>
            </div>
          </div>

          {/* Model Health Gauge */}
          <div className="border-t border-slate-200 dark:border-slate-800/60 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Model Training Health</span>
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 flex items-center gap-1.5"><Cpu size={14}/>Forecaster Engine</span>
              <span className="font-bold text-slate-700 dark:text-slate-100">Random Forest Regressor</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">R² Accuracy Score</span>
              <span className="font-bold text-emerald-500">{(metrics.r2_score * 100).toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Mean Absolute Error (MAE)</span>
              <span className="font-bold text-clinical-400">{metrics.mae_kw} kW</span>
            </div>
          </div>
        </div>

        {/* Pricing Estimator Cards */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          
          <div className="text-center sm:text-left sm:border-r border-slate-200 dark:border-slate-800/80 pr-4 space-y-2">
            <div className="p-2 bg-clinical-500/20 text-clinical-400 rounded-xl w-fit mx-auto sm:mx-0">
              <DollarSign size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Est. Daily Bill</span>
            <h3 className="text-2xl font-extrabold tracking-tight">${metrics.predicted_daily_cost_usd}</h3>
            <p className="text-[9px] text-slate-400">Calculated on real-time grid rates</p>
          </div>

          <div className="text-center sm:text-left sm:border-r border-slate-200 dark:border-slate-800/80 pr-4 space-y-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mx-auto sm:mx-0">
              <TrendingDown size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Renewable Savings</span>
            <h3 className="text-2xl font-extrabold tracking-tight text-emerald-500">${metrics.estimated_savings_usd} <span className="text-xs">/mo</span></h3>
            <p className="text-[9px] text-slate-400">Green offset bill deduction</p>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl w-fit mx-auto sm:mx-0 animate-pulse">
              <AlertOctagon size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Peak Pricing Hours</span>
            <h3 className="text-xl font-extrabold tracking-tight text-red-400">14:00 - 19:00</h3>
            <p className="text-[9px] text-slate-400">Avoid grid draws during this window</p>
          </div>

        </div>

      </div>

      {/* Forecast Line Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold mb-4">Predicted Load Profile (Next 24 Hours)</h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictions_24h} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGridPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSolarPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)"/>
              <XAxis dataKey="time" stroke="#475569" fontSize={9} />
              <YAxis stroke="#475569" fontSize={9} domain={[0, 'auto']}/>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff' }}/>
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" name="Total Forecasted Power (kW)" dataKey="predicted_power" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGridPred)"/>
              <Area type="monotone" name="Solar Offsetting Feed (kW)" dataKey="predicted_solar" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorSolarPred)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default EnergyPrediction;
