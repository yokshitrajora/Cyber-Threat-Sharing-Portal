import IncidentStreamTable from '../components/IncidentStreamTable';

export default function LiveFeed({ threats, onUpdateStatus, onRemoveThreat, isLiveConnected }) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
          <span className="px-3 py-1 rounded-full bg-white/80 text-slate-700 font-bold border border-slate-200 shadow-2xs">
            ✦ REALTIME LOG STREAM
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans border ${isLiveConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {isLiveConnected ? '● SQLite Active Sync' : '○ Standalone Session'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
          Live Incident <span className="font-serif italic font-normal text-slate-500">Detection Feed</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
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
