import IncidentStreamTable from '../components/IncidentStreamTable';

export default function LiveFeed({ threats, onUpdateStatus, onRemoveThreat, isLiveConnected }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white font-bold border border-white/20 backdrop-blur-md shadow-xs">
            ✦ REALTIME LOG STREAM
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${isLiveConnected ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
            {isLiveConnected ? '● SQLite Active Sync' : '○ Standalone Session'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans mt-2">
          Live Incident <span className="font-serif italic font-normal text-slate-300">Detection Feed</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Continuous telemetry stream of evaluated threat indicators stored in SQLite database.
        </p>
      </div>

      <IncidentStreamTable 
        extraThreats={threats} 
        onUpdateStatus={onUpdateStatus} 
        onRemoveThreat={onRemoveThreat} 
      />
    </div>
  );
}
