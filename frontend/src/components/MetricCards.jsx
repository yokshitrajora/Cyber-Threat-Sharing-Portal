import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
        if (mounted && data) {
          const active = data.active_threats ?? data.summary?.totalThreats ?? data.total_threats;
          const critical = data.critical_threats ?? data.summary?.criticalCount ?? (data.threat_levels?.Critical || 0);
          const score = data.avg_score ?? data.summary?.avgScore ?? 72.4;
          setMetrics({
            activeThreats: active !== undefined ? String(active) : DASHBOARD_METRICS.activeThreats.value,
            criticalCount: String(critical),
            avgScore: String(score),
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
    <div className="space-y-4">
      {/* 3-Card Hero Grid matching Reference UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Operations / Active Threats (White Card from Reference UI) */}
        <div className="bg-white rounded-[32px] p-6 border border-[#e8ece5] shadow-xs flex flex-col justify-between space-y-4 relative group">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#f4f6f2] flex items-center justify-center text-xs">⚙</span>
                <span className="text-xs font-bold text-slate-800 font-sans">Operations</span>
              </div>
              <button className="text-slate-400 hover:text-slate-800 text-sm font-bold tracking-widest cursor-pointer px-1">•••</button>
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#111315] font-sans tracking-tight">
                {metrics.activeThreats}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#dbf65f] text-[#111315] text-[10px] font-bold font-mono">
                  82% ⟳
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 1 000</span>
              </div>
            </div>
          </div>

          {/* Capsule Pills Row */}
          <div>
            <div className="flex items-center gap-1.5 pt-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-8 rounded-full transition-all ${
                    i < 5 ? 'bg-[#111315]' : 'bg-[#eef2eb] border-2 border-dashed border-[#cbd2c7]'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
              <span>{metrics.criticalCount} Critical Threats</span>
              <span className="text-slate-600 font-bold">{metrics.isLive ? '● Live Telemetry' : 'Edge Cache'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Data Transfer / Threat Activity (Lime Card from Reference UI) */}
        <div className="bg-[#dbf65f] text-[#111315] rounded-[32px] p-6 border border-[#cbe64c] shadow-xs flex flex-col justify-between space-y-4 relative group">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-xs">⇆</span>
                <span className="text-xs font-bold text-[#111315] font-sans">Data Transfer</span>
              </div>
              <button className="text-[#111315]/60 hover:text-[#111315] text-sm font-bold tracking-widest cursor-pointer px-1">•••</button>
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#111315] font-sans tracking-tight">
                {metrics.criticalCount}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[#111315] text-[10px] font-bold font-mono shadow-2xs">
                  68% ⟳
                </span>
                <span className="text-xs text-[#111315]/70 font-mono">/ 512.0 MB</span>
              </div>
            </div>
          </div>

          {/* Capsule Pills Row in Solid Black */}
          <div>
            <div className="flex items-center gap-1.5 pt-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-8 rounded-full transition-all ${
                    i < 4 ? 'bg-[#111315]' : 'bg-black/10 border-2 border-dashed border-black/25'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#111315]/75 mt-2">
              <span>Security Event Stream</span>
              <span className="font-bold">Real-time IO</span>
            </div>
          </div>
        </div>

        {/* Card 3: Take Your Automation / Defense to Next Level (Dark Hero Card from Reference UI) */}
        <div className="bg-[#111315] text-white rounded-[32px] p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]">
          <div className="relative z-10 max-w-[65%] space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
              Take Your <span className="inline-block text-[#dbf65f]">↗</span><br />
              Automation<br />
              to the Next Level
            </h3>
            <p className="text-[11px] text-slate-400">Autonomous edge scanning & SIEM export</p>
          </div>

          <div className="relative z-10 pt-4">
            <NavLink
              to="/feed"
              className="inline-flex items-center gap-2 bg-white text-[#111315] hover:bg-[#f4f6f2] px-5 py-2.5 rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Explore Feed</span>
              <span className="font-mono text-xs">▷</span>
            </NavLink>
          </div>

          {/* Glowing Graphic on right matching reference image */}
          <div className="absolute -right-2 top-0 bottom-0 w-[45%] flex items-center justify-center pointer-events-none opacity-90">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#dbf65f]/30 via-emerald-500/20 to-transparent rounded-full filter blur-xl"></div>
              <svg className="w-28 h-28 text-white/80 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 2a9 9 0 00-9 9c0 3.2 1.7 6 4.3 7.5L7 22l4-2 1 .5 1-.5 4 2-.3-3.5C19.3 17 21 14.2 21 11a9 9 0 00-9-9z" />
                <circle cx="9" cy="10" r="1.5" fill="#dbf65f" />
                <circle cx="15" cy="10" r="1.5" fill="#dbf65f" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 15h6" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Sub-telemetry strip with AI Accuracy & MTTD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl px-5 py-3.5 border border-[#e8ece5] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#f4f6f2] flex items-center justify-center text-xs">🎯</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">AI Confidence</span>
              <span className="text-base font-extrabold text-slate-900">{DASHBOARD_METRICS.aiAccuracy.value}</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#dbf65f]/20 text-[#111315] font-bold text-[10px] border border-[#dbf65f]/30 font-mono">
            {DASHBOARD_METRICS.aiAccuracy.change}
          </span>
        </div>

        <div className="bg-white rounded-2xl px-5 py-3.5 border border-[#e8ece5] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#f4f6f2] flex items-center justify-center text-xs">⚡</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Mean Time to Detect</span>
              <span className="text-base font-extrabold text-slate-900">{DASHBOARD_METRICS.mttd.value}</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 font-mono">
            {DASHBOARD_METRICS.mttd.change}
          </span>
        </div>
      </div>
    </div>
  );
}
