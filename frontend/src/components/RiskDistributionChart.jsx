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
        // Fallback
      }
    }
    loadCategories();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card-glass rounded-[28px] p-6 space-y-5">
      
      <div className="border-b border-slate-200/60 pb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
              Vector Classification
            </h3>
            {isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live SQLite Data"></span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Threat distribution across active vectors.</p>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/80 text-slate-600 border border-slate-200 font-bold shadow-xs">
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
              innerRadius={54}
              outerRadius={78}
              paddingAngle={4}
              dataKey="value"
            >
              {categories.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke="#ffffff" 
                  strokeWidth={2} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                color: '#0f172a',
                fontSize: '12px',
                fontFamily: 'sans-serif',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">{totalCount.toLocaleString()}</span>
          <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Total Threat Log</span>
        </div>
      </div>

      {/* Category Legends */}
      <div className="space-y-2 pt-1 text-xs">
        {categories.map((item) => (
          <div key={item.name} className="flex justify-between items-center p-2.5 rounded-2xl bg-white/70 border border-white hover:bg-white/90 transition shadow-xs">
            <div className="flex items-center gap-2.5 truncate pr-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-700 font-sans truncate text-xs font-semibold">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-[11px] font-semibold">{item.count}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200">
                {item.value}%
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
