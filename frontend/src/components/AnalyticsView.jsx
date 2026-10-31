import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAnalytics } from '../api/threatApi';

export default function AnalyticsView({ threats = [], onRefresh }) {
  const [liveAnalytics, setLiveAnalytics] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    setLiveLoading(true);
    getAnalytics()
      .then(data => setLiveAnalytics(data))
      .catch(() => setLiveAnalytics(null))
      .finally(() => setLiveLoading(false));
  }, []);

  // Chart data: prefer live backend breakdown, fallback to local threats array
  const chartData = useMemo(() => {
    if (liveAnalytics?.categories?.length > 0) {
      return liveAnalytics.categories.map(c => ({
        name: c.type || c.name,
        count: c.count
      }));
    }
    const categoryCounts = {};
    threats.forEach(threat => {
      const type = threat.type || threat.indicator_type || 'Unclassified';
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });
    return Object.keys(categoryCounts).map(cat => ({ name: cat, count: categoryCounts[cat] }));
  }, [threats, liveAnalytics]);

  const totalCount   = liveAnalytics?.total_threats     ?? threats.length;
  const highRiskCount = liveAnalytics?.critical_threats ?? threats.filter(t => t.score >= 80).length;
  const medRiskCount  = liveAnalytics
    ? Math.max(0, (liveAnalytics.total_threats ?? 0) - (liveAnalytics.critical_threats ?? 0) - ((liveAnalytics.threat_levels?.Low ?? 0)))
    : threats.filter(t => t.score >= 40 && t.score < 80).length;
  const avgScore      = liveAnalytics?.avg_score       ?? null;
  const verifiedCount = liveAnalytics?.verified_count  ?? threats.filter(t => t.verified).length;
  const sightingsTotal = liveAnalytics?.sightings_total ?? 0;

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-8 space-y-6 font-sans text-xs">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
            Threat Intelligence Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {liveAnalytics ? 'Live data from backend database.' : 'Aggregated from local cache.'}
          </p>
        </div>

        <button
          onClick={() => {
            setLiveLoading(true);
            getAnalytics()
              .then(setLiveAnalytics)
              .catch(() => setLiveAnalytics(null))
              .finally(() => setLiveLoading(false));
            if (onRefresh) onRefresh();
          }}
          disabled={liveLoading}
          className="btn-synthex-secondary px-4 py-2 rounded-full text-xs shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {liveLoading ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">Total Logged Indicators</span>
          <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
            {liveLoading ? '—' : totalCount}
          </span>
        </div>
        <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">Critical / High Risk</span>
          <span className="text-3xl font-extrabold text-rose-600 font-sans tracking-tight">
            {liveLoading ? '—' : highRiskCount}
          </span>
        </div>
        <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">Medium Risk (40–79)</span>
          <span className="text-3xl font-extrabold text-amber-600 font-sans tracking-tight">
            {liveLoading ? '—' : medRiskCount}
          </span>
        </div>
      </div>

      {/* Extended Live Metric Cards */}
      {liveAnalytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Avg Heuristic Score</span>
            <span className="text-3xl font-extrabold text-indigo-600 font-sans tracking-tight">{avgScore ?? '—'}</span>
          </div>
          <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Community Sightings</span>
            <span className="text-3xl font-extrabold text-emerald-600 font-sans tracking-tight">{sightingsTotal}</span>
          </div>
          <div className="bg-white/70 p-5 rounded-2xl border border-white space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Analyst Verified</span>
            <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">{verifiedCount}</span>
          </div>
        </div>
      )}

      {/* Bar Chart: Indicator Density by Category */}
      <div className="bg-white/60 p-6 rounded-2xl border border-white space-y-4 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-3.5">
          <span className="font-bold text-slate-900 text-xs">Indicator Density by Category</span>
          <span className="text-[10px] text-slate-400">Bar Scale: Integer Count</span>
        </div>

        {liveLoading ? (
          <div className="h-64 w-full flex items-center justify-center text-slate-400">
            Loading analytics data...
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

      {/* Severity & Status Distribution from live backend */}
      {liveAnalytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white/60 p-5 rounded-2xl border border-white space-y-3 shadow-xs">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60 pb-2">Severity Distribution</h4>
            {Object.entries(liveAnalytics.threat_levels || {}).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{level}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${level === 'Critical' ? 'bg-rose-500' : level === 'High' ? 'bg-amber-500' : level === 'Medium' ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (count / Math.max(totalCount, 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-800 w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/60 p-5 rounded-2xl border border-white space-y-3 shadow-xs">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60 pb-2">Status Distribution</h4>
            {Object.entries(liveAnalytics.statuses || {}).map(([st, count]) => (
              <div key={st} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{st}</span>
                <span className="font-bold text-slate-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
