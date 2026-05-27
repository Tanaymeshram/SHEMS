import React from 'react';
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
  Sun,
  Battery,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

function Renewables({ liveData }) {
  if (!liveData) {
    return <div className="text-center py-12 text-sm text-slate-400">Syncing Microgrid Feeds...</div>;
  }

  const { solar_gen, battery_charge, grid_import, total_power, renewable_ratio } = liveData.renewables;

  // Mock historical solar/battery tracking curves
  const mockDailyMicrogridData = Array.from({ length: 8 }).map((_, i) => {
    const hr = 8 + i * 2;
    const solarGen = hr >= 18 || hr <= 6 ? 0 : Math.sin((hr - 6) / 12 * Math.PI) * 40.0;
    const batCharge = hr >= 14 && hr <= 19 ? 85 - (hr - 14) * 12 : 45 + (hr - 8) * 6;
    return {
      time: `${hr}:00`,
      solar: parseFloat(solarGen.toFixed(1)),
      battery: parseFloat(Math.min(100, Math.max(10, batCharge)).toFixed(1))
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
          <Sun className="text-clinical-500 animate-spin-slow" />
          <span>Renewable Energy Optimization Module</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Monitor rooftop solar arrays, oversee battery backup dispatch profiles, and review grid balancing performance.
        </p>
      </div>

      {/* Grid: Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solar Generation</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-yellow-500">{solar_gen} kW</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Peak capacity 45kW</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Battery Backup</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-teal-400">{battery_charge}%</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">100 kWh Tesla Pack</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grid Import Draw</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-clinical-400">{grid_import} kW</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Utility substation load</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clean Energy Ratio</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-emerald-500">{renewable_ratio}%</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Daily clean energy share</span>
        </div>

      </div>

      {/* Grid Routing Map & Historical Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Routing Map */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold">Microgrid Flow Directory</h3>
          <p className="text-[11px] text-slate-400 font-semibold">Live energy routing mapping</p>

          <div className="space-y-4 py-2">
            
            {/* Solar Route */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="text-yellow-500" size={16} />
                <span className="text-xs font-bold">Rooftop Solar</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
              <div className="text-right">
                <span className="text-xs font-extrabold text-yellow-500">+{solar_gen} kW</span>
              </div>
            </div>

            {/* Battery Dispatch Route */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="text-teal-400" size={16} />
                <span className="text-xs font-bold">Grid Battery</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
              <div className="text-right">
                {solar_gen > total_power ? (
                  <span className="text-xs font-extrabold text-teal-400">Charging</span>
                ) : (
                  <span className="text-xs font-extrabold text-teal-400">Peak Shaving</span>
                )}
              </div>
            </div>

            {/* Main Utility Grid Substation */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-clinical-400" size={16} />
                <span className="text-xs font-bold">Utility Substation</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
              <div className="text-right">
                <span className="text-xs font-extrabold text-clinical-400">{grid_import} kW</span>
              </div>
            </div>

          </div>
        </div>

        {/* Microgrid Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold mb-4">Historical Microgrid Generation Profile</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyMicrogridData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSolarRen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBatRen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="time" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff' }}/>
                <Area type="monotone" name="Solar Array Output (kW)" dataKey="solar" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorSolarRen)"/>
                <Area type="monotone" name="Battery Charge Reserve (%)" dataKey="battery" stroke="#2dd4bf" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBatRen)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Renewables;
