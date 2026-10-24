import ThreatTimelineChart from '../components/ThreatTimelineChart';
import RiskDistributionChart from '../components/RiskDistributionChart';

export default function Analytics() {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
          <span className="px-3 py-1 rounded-full bg-white/80 text-slate-700 font-bold border border-slate-200 shadow-2xs">
            ✦ ANALYTICS & METRICS
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
          Threat Analytics & <span className="font-serif italic font-normal text-slate-500">Vector Intelligence</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
          Historical timeline trends and vector classification breakdown from SQLite core.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ThreatTimelineChart />
        </div>
        <div className="lg:col-span-4">
          <RiskDistributionChart />
        </div>
      </div>
    </div>
  );
}
