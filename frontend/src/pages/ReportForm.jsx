import InspectionPanel from '../components/InspectionPanel';

export default function ReportForm({ addThreat }) {
  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
          <span className="px-3 py-1 rounded-full bg-white/80 text-slate-700 font-bold border border-slate-200 shadow-2xs">
            ✦ INDICATOR SCANNER
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
          Ingest & Analyze <span className="font-serif italic font-normal text-slate-500">Indicator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
          Input suspicious URLs, IP addresses, or email headers for real-time parameter sanitization and AI risk scoring.
        </p>
      </div>

      <InspectionPanel onThreatAdded={addThreat} />
    </div>
  );
}
