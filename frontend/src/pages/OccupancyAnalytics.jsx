import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import {
  Users,
  Compass,
  Zap,
  Lightbulb,
  Cpu
} from 'lucide-react';

function OccupancyAnalytics({ liveData }) {
  if (!liveData) {
    return <div className="text-center py-12 text-sm text-slate-400">Syncing Occupancy Sensors...</div>;
  }

  // Prepping bar chart data
  const occupancyBarData = Object.entries(liveData.wings).map(([name, w]) => ({
    name,
    Occupancy: w.occupancy,
    Power: w.power
  }));

  // Generating mock scatter correlation points based on current ratio
  const correlationData = Object.entries(liveData.wings).flatMap(([name, w], index) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const baseOcc = Math.max(1, w.occupancy + randomFluc(-2, 2));
      const basePower = Math.max(5.0, w.power + randomFluc(-4, 4));
      return {
        wing: name,
        occupancy: baseOcc,
        power: parseFloat(basePower.toFixed(1)),
        idx: index
      };
    });
  });

  function randomFluc(min, max) {
    return Math.random() * (max - min) + min;
  }

  const COLORS = ['#0ea5e9', '#10b981', '#14b8a6', '#f43f5e', '#a855f7'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
          <Users className="text-clinical-500" />
          <span>Occupancy-Aware Smart Lighting & Cooling</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Monitor real-time motion sensors, track wing-level human density, and view thermodynamic efficiency matrices.
        </p>
      </div>

      {/* Sensor snapshot grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-clinical-500/10 text-clinical-400 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Headcount</span>
            <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {Object.values(liveData.wings).reduce((sum, w) => sum + w.occupancy, 0)} Active
            </h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
            <Lightbulb size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Light Zones</span>
            <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {Object.values(liveData.wings).filter(w => w.lights === 1).length} Wards ON
            </h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <Cpu size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Schedule Accuracy</span>
            <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">96.8% Nominal</h3>
          </div>
        </div>

      </div>

      {/* Comparative Load Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar: Occupancy vs Power Draw */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold mb-4">Wing Headcount Comparative</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff' }}/>
                <Bar name="Occupancy Count" dataKey="Occupancy" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  {occupancyBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter: Correlation of Occupancy vs Power */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold mb-4">ML Core: Occupancy-Power Scatter</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                <XAxis type="number" dataKey="occupancy" name="Occupancy" unit=" pax" stroke="#475569" fontSize={9} />
                <YAxis type="number" dataKey="power" name="Power" unit=" kW" stroke="#475569" fontSize={9} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff' }}/>
                <Scatter name="Correlation Profile" dataKey="power" data={correlationData} fill="#14b8a6">
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.idx % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

export default OccupancyAnalytics;
