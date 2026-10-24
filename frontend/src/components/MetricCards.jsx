import { useState, useEffect } from 'react';
import { DASHBOARD_METRICS } from '../data/mockThreats';
import { getAnalytics } from '../api/threatApi';

export default function MetricCards() {
  const [metrics, setMetrics] = useState({
    activeThreats: DASHBOARD_METRICS.activeThreats.value,
    criticalCount: '34',
    avgScore: '72.4',
    isLive: false
  });

  useEffect(() => {
    let mounted = true;
    async function loadMetrics() {
      try {
        const data = await getAnalytics();
        if (mounted && data?.summary) {
          setMetrics({
            activeThreats: data.summary.totalThreats.toLocaleString(),
            criticalCount: String(data.summary.criticalCount || 0),
            avgScore: String(data.summary.avgScore || 70),
            isLive: true
          });
        }
      } catch {
        // Fallback gracefully to default metrics if offline
      }
    }
    loadMetrics();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* 1. Active Threats */}
      <div className="card-glass rounded-[26px] p-5 space-y-4 relative group">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
                Active Threats
              </span>
              {metrics.isLive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live SQLite Data"></span>
              )}
            </div>
            <span className="text-3xl font-extrabold text-slate-900 font-sans mt-1 block tracking-tight">
              {metrics.activeThreats}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200/60">
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-mono font-bold text-[11px] border border-rose-200/80">
            {metrics.criticalCount} Critical
          </span>
          <span className="text-slate-500 text-[11px] truncate">
            {metrics.isLive ? 'Active in SQLite core' : DASHBOARD_METRICS.activeThreats.subtext}
          </span>
        </div>
      </div>

      {/* 2. AI Confidence Score */}
      <div className="card-glass rounded-[26px] p-5 space-y-4 relative group">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              AI Confidence Score
            </span>
            <span className="text-3xl font-extrabold text-slate-900 font-sans mt-1 block tracking-tight">
              {DASHBOARD_METRICS.aiAccuracy.value}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200/60">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono font-bold text-[11px] border border-indigo-200/80">
            {DASHBOARD_METRICS.aiAccuracy.change}
          </span>
          <span className="text-slate-500 text-[11px] truncate">
            Real-time Telemetry Accuracy
          </span>
        </div>
      </div>

      {/* 3. Mean Time to Detect */}
      <div className="card-glass rounded-[26px] p-5 space-y-4 relative group">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              Mean Time to Detect
            </span>
            <span className="text-3xl font-extrabold text-emerald-600 font-sans mt-1 block tracking-tight">
              {DASHBOARD_METRICS.mttd.value}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200/60">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-mono font-bold text-[11px] border border-emerald-200/80">
            {DASHBOARD_METRICS.mttd.change}
          </span>
          <span className="text-slate-500 text-[11px] truncate">
            {DASHBOARD_METRICS.mttd.subtext}
          </span>
        </div>
      </div>

      {/* 4. Monitored Endpoints */}
      <div className="card-glass rounded-[26px] p-5 space-y-4 relative group">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              Monitored Endpoints
            </span>
            <span className="text-3xl font-extrabold text-slate-900 font-sans mt-1 block tracking-tight">
              {DASHBOARD_METRICS.monitoredNodes.value}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200/60">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200">
            {DASHBOARD_METRICS.monitoredNodes.change}
          </span>
          <span className="text-slate-500 text-[11px] truncate">
            {DASHBOARD_METRICS.monitoredNodes.subtext}
          </span>
        </div>
      </div>

    </div>
  );
}
