import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsView({ threats = [], loading, error, onRefresh }) {
  // Aggregate category counts from threats list
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
    <div className="card-3d rounded-2xl p-6 space-y-5 font-mono text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-sans">
            Threat Intelligence Metrics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Aggregated metrics and indicator distribution from SQLite database.</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-3d-secondary px-3.5 py-1.5 rounded-xl text-xs shrink-0 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Logged Indicators</span>
          <span className="text-2xl font-bold text-white">{totalCount}</span>
        </div>

        <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">High Risk (≥ 80)</span>
          <span className="text-2xl font-bold text-rose-400">{highRiskCount}</span>
        </div>

        <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Medium Risk (40 - 79)</span>
          <span className="text-2xl font-bold text-amber-300">{medRiskCount}</span>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="font-bold text-white uppercase text-[11px]">
            Indicator Density by Category
          </span>
          <span className="text-[10px] text-slate-400">Bar Scale: Integer Count</span>
        </div>

        {loading ? (
          <div className="h-64 w-full flex items-center justify-center text-slate-400">
            Calculating telemetry distribution...
          </div>
        ) : error ? (
          <div className="h-64 w-full flex flex-col items-center justify-center text-rose-300 space-y-2">
            <p>{error}</p>
            <button onClick={onRefresh} className="btn-3d-primary px-3 py-1 rounded-full text-xs">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                  dy={8} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
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
                <Bar dataKey="count" fill="#ffffff" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
