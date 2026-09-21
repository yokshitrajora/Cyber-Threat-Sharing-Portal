import ThreatTimelineChart from '../components/ThreatTimelineChart';
import RiskDistributionChart from '../components/RiskDistributionChart';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white font-bold border border-white/20 backdrop-blur-md shadow-xs">
            ✦ ANALYTICS & METRICS
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans mt-2">
          Threat Analytics & <span className="font-serif italic font-normal text-slate-300">Vector Intelligence</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
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
