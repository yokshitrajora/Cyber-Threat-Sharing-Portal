import MetricCards from '../components/MetricCards';
import ThreatTimelineChart from '../components/ThreatTimelineChart';
import RiskDistributionChart from '../components/RiskDistributionChart';
import IncidentStreamTable from '../components/IncidentStreamTable';

export default function Console({ threats, onUpdateStatus, onRemoveThreat, isLiveConnected }) {
  return (
    <div className="space-y-6">
      
      {/* Overview Section Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white font-bold border border-white/20 backdrop-blur-md shadow-xs">
              ✦ AI TELEMETRY SOC CONSOLE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans mt-2">
            Threat Detection <span className="font-serif italic font-normal text-slate-300">Overview</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 flex items-center gap-2 backdrop-blur-md shadow-xs">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {isLiveConnected ? 'Shield AI Engine Core Live' : 'SQLite Local Core Fallback'}
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <MetricCards />

      {/* Middle Grid Row: 24-Hour Area Chart (8 Cols) + Vector Donut Chart (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ThreatTimelineChart />
        </div>
        <div className="lg:col-span-4">
          <RiskDistributionChart />
        </div>
      </div>

      {/* Bottom Full-Width Live Incident Stream Table */}
      <IncidentStreamTable 
        extraThreats={threats} 
        onUpdateStatus={onUpdateStatus} 
        onRemoveThreat={onRemoveThreat} 
      />

    </div>
  );
}
