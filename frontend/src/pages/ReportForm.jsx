import InspectionPanel from '../components/InspectionPanel';

export default function ReportForm({ addThreat }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white font-bold border border-white/20 backdrop-blur-md shadow-xs">
            ✦ INDICATOR SCANNER
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans mt-2">
          Ingest & Analyze <span className="font-serif italic font-normal text-slate-300">Indicator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Input suspicious URLs, IP addresses, or email headers for real-time parameter sanitization and AI risk scoring.
        </p>
      </div>

      <InspectionPanel onThreatAdded={addThreat} />
    </div>
  );
}
