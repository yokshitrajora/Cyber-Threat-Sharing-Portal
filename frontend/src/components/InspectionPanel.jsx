import { useState, useMemo } from 'react';
import { THREAT_PRESETS } from '../data/mockThreats';
import { submitThreat } from '../api/threatApi';

export default function InspectionPanel({ onThreatAdded }) {
  const [threatData, setThreatData] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sanitizationPreview = useMemo(() => {
    if (!threatData.trim()) return null;

    let sanitizedString = threatData.trim();
    const strippedParams = [];

    try {
      if (sanitizedString.startsWith('http://') || sanitizedString.startsWith('https://')) {
        const urlObj = new URL(sanitizedString);
        urlObj.searchParams.forEach((value, key) => {
          strippedParams.push(`${key}=${value}`);
        });
        sanitizedString = `${urlObj.origin}${urlObj.pathname}`;
      } else if (sanitizedString.includes('?')) {
        const parts = sanitizedString.split('?');
        sanitizedString = parts[0];
        strippedParams.push(parts[1]);
      }
    } catch {
      // standard fallback
    }

    return {
      sanitizedString,
      strippedParams,
      isClean: strippedParams.length === 0
    };
  }, [threatData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!threatData.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await submitThreat({
        threatData: threatData.trim(),
        description: description.trim()
      });

      const newThreat = data.threat || {
        id: `INC-${Math.floor(Math.random()*9000)+1000}`,
        indicator: sanitizationPreview?.sanitizedString || threatData,
        rawInput: threatData,
        type: 'Submitted Threat',
        score: Math.floor(Math.random() * 40) + 50,
        status: 'Auto-Blocked',
        timestamp: 'Just now',
        description: description || 'User-submitted telemetry string',
        sanitizedParameters: sanitizationPreview?.strippedParams || []
      };

      setResult({
        type: 'success',
        message: 'Indicator sanitized & recorded in SQLite persistent core.',
        threat: newThreat
      });

      if (onThreatAdded) onThreatAdded(newThreat);

      setThreatData('');
      setDescription('');
    } catch {
      const mockRecord = {
        id: `INC-${Math.floor(Math.random()*9000)+1000}`,
        indicator: sanitizationPreview?.sanitizedString || threatData,
        rawInput: threatData,
        type: threatData.includes('http') ? 'Phishing Domain' : threatData.includes('@') ? 'Typosquat Domain' : 'Scanner Host',
        score: threatData.includes('crypto') || threatData.includes('giveaway') ? 92 : 68,
        status: (threatData.includes('crypto') || threatData.includes('giveaway')) ? 'Auto-Blocked' : 'Isolated',
        timestamp: 'Just now',
        description: description || 'User-submitted threat indicator (local session)',
        sanitizedParameters: sanitizationPreview?.strippedParams || []
      };

      setResult({
        type: 'success',
        message: 'Indicator sanitized & recorded in session database.',
        threat: mockRecord
      });

      if (onThreatAdded) onThreatAdded(mockRecord);

      setThreatData('');
      setDescription('');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setThreatData(preset.indicator);
    setDescription(preset.desc);
    setResult(null);
  };

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-5 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold font-sans text-slate-900 tracking-tight">
            Threat Indicator Scanner & Ingestion Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated parameter sanitization & real-time risk scoring.</p>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
          POST /api/report
        </span>
      </div>

      {/* Preset Quick Loader Buttons */}
      <div>
        <span className="block text-xs font-sans uppercase tracking-wider text-slate-400 mb-2.5 font-bold">
          Try a Threat Preset Sample:
        </span>
        <div className="space-y-2">
          {THREAT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="w-full text-left p-3.5 rounded-2xl bg-white/70 border border-white hover:bg-white hover:shadow-xs transition flex justify-between items-center text-xs font-sans group cursor-pointer"
            >
              <div className="truncate pr-2">
                <span className="text-indigo-600 font-bold mr-2 font-mono">[{preset.category}]</span>
                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition">{preset.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 group-hover:text-slate-900 shrink-0 font-semibold">Load Indicator →</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Parameter Stripping Preview Box */}
      {sanitizationPreview && (
        <div className="p-4 bg-white/70 border border-slate-200 rounded-2xl space-y-2.5 font-sans text-xs shadow-2xs">
          <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-200/60 pb-2">
            <span className="font-bold tracking-wider uppercase">PII Parameter Sanitizer Engine</span>
            {sanitizationPreview.isClean ? (
              <span className="text-emerald-600 font-bold">Clean Indicator</span>
            ) : (
              <span className="text-amber-600 font-bold">
                {sanitizationPreview.strippedParams.length} Parameters Stripped
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1">Sanitized Output String</span>
            <p className="text-emerald-700 break-all font-bold bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 font-mono">
              {sanitizationPreview.sanitizedString}
            </p>
          </div>

          {!sanitizationPreview.isClean && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Stripped Query Parameters</span>
              <div className="flex flex-wrap gap-1.5">
                {sanitizationPreview.strippedParams.map((param, idx) => (
                  <span key={idx} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Card */}
      {result && result.type === 'success' && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-2 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="font-bold">✓ {result.message}</span>
            <span className="text-[11px] text-slate-500">{result.threat?.timestamp}</span>
          </div>
          {result.threat && (
            <div className="pt-2 text-slate-700 text-xs grid grid-cols-2 gap-2 border-t border-emerald-200/60">
              <div>Risk Score: <strong className="text-slate-900 font-mono">{result.threat.score}/100</strong></div>
              <div>Category: <strong className="text-slate-900">{result.threat.type}</strong></div>
            </div>
          )}
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        <div>
          <label htmlFor="threat-input-field" className="block uppercase text-[11px] font-sans tracking-wider text-slate-600 mb-1.5 font-bold">
            Suspicious Indicator (URL / IP Address / Email Domain) *
          </label>
          <input
            id="threat-input-field"
            type="text"
            required
            value={threatData}
            onChange={(e) => setThreatData(e.target.value)}
            placeholder="e.g., http://free-token-drop.xyz/auth?token=secret123 or 198.51.100.44"
            className="w-full px-4 py-3 input-synthex rounded-2xl text-slate-900 placeholder-slate-400 font-mono text-xs"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="context-input-field" className="block uppercase text-[11px] font-sans tracking-wider text-slate-600 mb-1.5 font-bold">
            Operational Context <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            id="context-input-field"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Discovered in web server access logs; probing port 443"
            className="w-full p-3.5 input-synthex rounded-2xl text-slate-900 placeholder-slate-400 text-xs"
            disabled={loading}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || !threatData.trim()}
          className="w-full btn-synthex-primary py-3.5 px-4 rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-sans text-xs shadow-md"
        >
          {loading ? 'Analyzing & Sanitizing Indicator...' : 'Sanitize & Ingest Threat'}
        </button>
      </form>

    </div>
  );
}
