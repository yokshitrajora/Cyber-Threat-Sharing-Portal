import InteractiveThreatMap from '../components/InteractiveThreatMap';

export default function ThreatMapPage() {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs">
            ✦ GEOSPATIAL INTELLIGENCE
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans border bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
            ● Leaflet Engine Live
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
          Global Threat <span className="font-serif italic font-normal text-slate-500">Origin Map</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
          Interactive geographical visualization of attacking IPs and probe vectors targeting local community endpoints.
        </p>
      </div>

      <InteractiveThreatMap />
    </div>
  );
}
