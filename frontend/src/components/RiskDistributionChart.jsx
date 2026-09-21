import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY_BREAKDOWN } from '../data/mockThreats';
import { getAnalytics } from '../api/threatApi';

export default function RiskDistributionChart() {
  const [categories, setCategories] = useState(CATEGORY_BREAKDOWN);
  const [totalCount, setTotalCount] = useState(1482);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const data = await getAnalytics();
        if (mounted && data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          setTotalCount(data.summary?.totalThreats || data.categories.reduce((a, b) => a + b.count, 0));
          setIsLive(true);
        }
      } catch {
        // Fallback to CATEGORY_BREAKDOWN if offline
      }
    }
    loadCategories();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card-3d rounded-2xl p-5 space-y-4">
      
      <div className="border-b border-white/10 pb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              Vector Classification
            </h3>
            {isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live SQLite Data"></span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Threat distribution across active vectors.</p>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/20 font-bold backdrop-blur-md">
          {categories.length} Categories
        </span>
      </div>

      {/* Donut Chart Display */}
      <div className="h-48 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(10, 14, 24, 0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 14, 24, 0.95)',
                borderRadius: '12px',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
          <span className="text-xl font-extrabold text-white">{totalCount.toLocaleString()}</span>
          <span className="text-[10px] uppercase text-slate-400 font-semibold">Total Threat Log</span>
        </div>
      </div>

      {/* Category Legends */}
      <div className="space-y-2 pt-1 font-mono text-xs">
        {categories.map((item) => (
          <div key={item.name} className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-200 font-sans truncate text-xs font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-[11px] font-semibold">{item.count}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-white/10 border border-white/20">
                {item.value}%
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
