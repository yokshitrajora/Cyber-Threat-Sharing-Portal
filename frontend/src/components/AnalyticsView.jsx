import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsView({ threats = [], loading, error, onRefresh }) {
  const chartData = useMemo(() => {
    const categoryCounts = {};
    threats.forEach((threat) => {
      const type = threat.type || 'Unclassified';
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });

    return Object.keys(categoryCounts).map((cat) => ({
      name: cat,
      count: categoryCounts[cat]
    }));
  }, [threats]);

  const totalCount = threats.length;
  const highRiskCount = threats.filter(t => t.score >= 80).length;
  const medRiskCount = threats.filter(t => t.score >= 40 && t.score < 80).length;

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-8 space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
            Threat Intelligence Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated metrics and indicator distribution from SQLite database.</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-synthex-secondary px-4 py-2 rounded-full text-xs shrink-0 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">Total Logged Indicators</span>
          <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">{totalCount}</span>
        </div>

        <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">High Risk (≥ 80)</span>
          <span className="text-3xl font-extrabold text-rose-600 font-sans tracking-tight">{highRiskCount}</span>
        </div>

        <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">Medium Risk (40 - 79)</span>
          <span className="text-3xl font-extrabold text-amber-600 font-sans tracking-tight">{medRiskCount}</span>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="bg-white/60 p-6 rounded-2xl border border-white space-y-4 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-3.5">
          <span className="font-bold text-slate-900 text-xs">
            Indicator Density by Category
          </span>
          <span className="text-[10px] text-slate-400">Bar Scale: Integer Count</span>
        </div>

        {loading ? (
          <div className="h-64 w-full flex items-center justify-center text-slate-400">
            Calculating telemetry distribution...
          </div>
        ) : error ? (
          <div className="h-64 w-full flex flex-col items-center justify-center text-rose-600 space-y-2">
            <p>{error}</p>
            <button onClick={onRefresh} className="btn-synthex-primary px-4 py-1.5 rounded-full text-xs">
              Retry
            </button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 w-full flex items-center justify-center text-slate-400">
            No dataset available to graph.
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }} 
                  dy={8} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
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
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
