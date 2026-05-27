import React from 'react';
import { api } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Leaf,
  TrendingDown,
  Globe,
  Trees,
  Car,
  Download
} from 'lucide-react';

function CarbonFootprint({ liveData }) {
  if (!liveData) {
    return <div className="text-center py-12 text-sm text-slate-400">Syncing Carbon Monitors...</div>;
  }

  // Calculate live CO2 emissions based on grid import
  // 0.42 kg CO2 per kWh
  const liveCo2Emission = liveData.renewables.grid_import * 0.42;

  // Mock historical carbon emissions trends
  const mockHistoricalCarbon = Array.from({ length: 6 }).map((_, i) => {
    const daysAgo = 5 - i;
    const baseCo2 = 450 - daysAgo * 40 + randomFluc(-20, 20);
    const offsetCo2 = 120 + daysAgo * 15;
    return {
      name: `${daysAgo}d ago`,
      emitted: parseFloat(baseCo2.toFixed(1)),
      offset: parseFloat(offsetCo2.toFixed(1))
    };
  });

  function randomFluc(min, max) {
    return Math.random() * (max - min) + min;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Leaf className="text-emerald-500" />
            <span>Carbon Footprint Tracking Dashboard</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Track daily greenhouse gas offsets, verify clinical sustainability compliance, and check efficiency ratings.
          </p>
        </div>

        <div className="flex gap-2">
          {/* CSV Exporter */}
          <a
            href={api.getReportExportUrl('carbon')}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Download size={14} />
            <span>Download Audit Dataset</span>
          </a>
        </div>
      </div>

      {/* Grid: Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total live carbon emitted */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Carbon Impact</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-slate-800 dark:text-slate-100">{liveCo2Emission.toFixed(2)} <span className="text-xs">kg CO₂/h</span></h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Derived from grid load</span>
        </div>

        {/* Dynamic Sustainability Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sustainability Index</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-emerald-500">92 / 100</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Green Zone Efficiency</span>
        </div>

        {/* Tree Offset Equivalent */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trees Equivalent</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-emerald-400 flex items-center gap-2">
            <Trees size={24} />
            <span>{Math.round(liveData.savings.carbon_kg * 0.05)} Trees</span>
          </h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Forest equivalent carbon mitigation</span>
        </div>

        {/* Miles Offset Equivalent */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Miles Offset</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-cyan-400 flex items-center gap-2">
            <Car size={24} />
            <span>{Math.round(liveData.savings.carbon_kg * 2.5)} Miles</span>
          </h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Avoided passenger car emissions</span>
        </div>

      </div>

      {/* Grid: Carbon comparative chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* comparative scorecard */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold">Climate Compliance Summary</h3>
          <p className="text-[11px] text-slate-400 font-semibold">ESG reporting highlights</p>

          <div className="space-y-3 pt-2 text-xs font-semibold">
            <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
              <span className="text-slate-400">Total Carbon Offset (Cumulative)</span>
              <span className="font-extrabold text-emerald-500">-{liveData.savings.carbon_kg.toFixed(1)} kg</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
              <span className="text-slate-400">Grid Draw Carbon Charge</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">{(liveData.renewables.grid_import * 0.42).toFixed(2)} kg/h</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
              <span className="text-slate-400">Solar Energy Offset Credit</span>
              <span className="font-extrabold text-yellow-500">{(liveData.renewables.solar_gen * 0.42).toFixed(2)} kg/h</span>
            </div>
          </div>
        </div>

        {/* Carbon Trend Area Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold mb-4">Carbon Footprint Trend (Last 6 Days)</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHistoricalCarbon} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOffset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff' }}/>
                <Area type="monotone" name="Carbon Emitted (kg CO₂)" dataKey="emitted" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorEmit)"/>
                <Area type="monotone" name="Carbon Offset (kg CO₂)" dataKey="offset" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorOffset)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

export default CarbonFootprint;
