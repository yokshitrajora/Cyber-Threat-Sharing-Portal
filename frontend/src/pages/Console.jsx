import MetricCards from '../components/MetricCards';
import ThreatTimelineChart from '../components/ThreatTimelineChart';
import RiskDistributionChart from '../components/RiskDistributionChart';
import IncidentStreamTable from '../components/IncidentStreamTable';

export default function Console({ threats, onUpdateStatus, onRemoveThreat, isLiveConnected }) {
  return (
    <div className="space-y-7">
      
      {/* Overview Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
            <span className="px-3 py-1 rounded-full bg-white/80 text-slate-700 font-bold border border-slate-200 shadow-2xs">
              ✦ AI TELEMETRY SOC CONSOLE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
            Threat Detection <span className="font-serif italic font-normal text-slate-500">Overview</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            {isLiveConnected ? 'Shield AI Engine Core Live' : 'SQLite Local Core Fallback'}
          </span>
        </div>
      </div>

      {/* Top Synthex Metric Cards with Peeking Mini Charts */}
      <MetricCards />

      {/* Middle Grid Row: Spline Dynamics Chart (8 Cols) + Vector Classification (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ThreatTimelineChart />
        </div>
        <div className="lg:col-span-4">
          <RiskDistributionChart />
        </div>
      </div>

      {/* Bottom Live Incident Stream Table */}
      <IncidentStreamTable 
        extraThreats={threats} 
        onUpdateStatus={onUpdateStatus} 
        onRemoveThreat={onRemoveThreat} 
      />

    </div>
  );
}
