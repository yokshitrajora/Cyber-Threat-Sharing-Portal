import { useState, useMemo } from 'react';

export default function TelemetryLog({ threats = [], onRefresh, loading, error }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [density, setDensity] = useState('detailed'); // 'compact' | 'detailed'
  const [selectedThreat, setSelectedThreat] = useState(null);

  const filteredThreats = useMemo(() => {
    return threats.filter((threat) => {
      const matchesSearch = 
        threat.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (threat.description && threat.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        threat.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'ALL' || threat.type === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [threats, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(threats.map(t => t.type));
    return ['ALL', ...Array.from(set)];
  }, [threats]);

  const getRiskBadgeStyle = (score) => {
    if (score >= 80) {
      return {
        badge: 'bg-rose-50 text-rose-600 border border-rose-200',
        scoreText: 'text-rose-600'
      };
    }
    if (score >= 40) {
      return {
        badge: 'bg-amber-50 text-amber-700 border border-amber-200',
        scoreText: 'text-amber-600'
      };
    }
    return {
      badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      scoreText: 'text-emerald-600'
    };
  };

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-7 space-y-5 font-sans text-xs">
      
      {/* Telemetry Log Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
            Telemetry Stream & Indicator Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time log of anonymized threat indicators stored in SQLite database.</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Data Density Toggle */}
          <div className="pill-group">
            <button
              onClick={() => setDensity('detailed')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                density === 'detailed' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                density === 'compact' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compact
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-synthex-secondary px-3.5 py-1.5 rounded-full text-xs shrink-0 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Log'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicator string, domain, or notes..."
            className="w-full px-4 py-2 input-synthex rounded-full text-slate-800 placeholder-slate-400 text-xs font-sans"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-white/70 border border-slate-200 rounded-full text-slate-700 outline-none text-xs font-sans shadow-2xs cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Data Display */}
      {loading ? (
        <div className="p-12 text-center bg-white/40 rounded-2xl border border-slate-200 text-slate-400">
          Fetching telemetry records...
        </div>
      ) : error ? (
        <div className="p-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl space-y-2">
          <p className="font-bold">Database Error: {error}</p>
          <button
            onClick={onRefresh}
            className="btn-synthex-primary px-3 py-1 text-xs"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredThreats.length === 0 ? (
        <div className="p-12 text-center bg-white/40 rounded-2xl border border-slate-200 text-slate-400">
          No threat indicators match the specified query filters.
        </div>
      ) : density === 'compact' ? (
        /* Compact Table Layout */
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/50 backdrop-blur-md shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/60 text-slate-500 text-[11px] font-sans font-bold uppercase tracking-wider border-b border-slate-200/70">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Indicator String</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 text-xs font-sans">
              {filteredThreats.map((threat) => {
                const style = getRiskBadgeStyle(threat.score);
                return (
                  <tr 
                    key={threat.id}
                    onClick={() => setSelectedThreat(threat)}
                    className="hover:bg-white/80 cursor-pointer transition-all"
                  >
                    <td className="p-3.5 text-slate-500 font-mono">{threat.id}</td>
                    <td className="p-3.5 text-slate-800 font-semibold">{threat.type}</td>
                    <td className="p-3.5 text-slate-800 font-mono font-medium max-w-xs truncate">
                      {threat.indicator}
                    </td>
                    <td className="p-3.5 text-slate-400 text-xs">{threat.timestamp}</td>
                    <td className={`p-3.5 text-right font-sans font-bold ${style.scoreText}`}>
                      {threat.score}/100
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Detailed List Card View */
        <div className="space-y-3">
          {filteredThreats.map((threat) => {
            const style = getRiskBadgeStyle(threat.score);
            return (
              <div
                key={threat.id}
                onClick={() => setSelectedThreat(threat)}
                className="p-4 rounded-2xl bg-white/70 border border-white hover:bg-white hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                      {threat.type}
                    </span>
                    <span className="text-slate-400 text-xs">{threat.timestamp}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${style.badge}`}>
                      {threat.status || (threat.score >= 80 ? 'CRITICAL' : threat.score >= 40 ? 'ELEVATED' : 'PASS')}
                    </span>
                  </div>

                  <p className="text-sm font-mono font-medium text-slate-900 break-all group-hover:text-indigo-600 transition">
                    {threat.indicator}
                  </p>

                  {threat.description && (
                    <p className="text-xs text-slate-500 font-sans italic">
                      "{threat.description}"
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className={`text-xl font-bold font-sans ${style.scoreText}`}>
                    {threat.score}<span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Heuristic Rating</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Indicator Inspection Drawer */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card-glass rounded-[28px] p-7 max-w-lg w-full space-y-5 font-sans text-xs shadow-2xl border border-white">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3.5">
              <span className="font-bold text-slate-900 text-sm font-sans">
                [INSPECTOR] Indicator Breakdown #{selectedThreat.id}
              </span>
              <button
                onClick={() => setSelectedThreat(null)}
                className="btn-synthex-icon w-8 h-8 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 font-sans">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Indicator String</span>
                <p className="p-3 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 font-mono break-all font-bold text-xs shadow-2xs">
                  {selectedThreat.indicator}
                </p>
              </div>

              {selectedThreat.rawInput && selectedThreat.rawInput !== selectedThreat.indicator && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Raw Input (Pre-Sanitization)</span>
                  <p className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-rose-800 font-mono break-all text-xs">
                    {selectedThreat.rawInput}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Risk Score</span>
                  <span className="text-xl font-bold text-slate-900 font-sans">{selectedThreat.score}/100</span>
                </div>
                <div className="p-3.5 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Threat Category</span>
                  <span className="text-sm font-bold text-slate-800">{selectedThreat.type}</span>
                </div>
              </div>

              {selectedThreat.description && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Context Note</span>
                  <p className="p-3 bg-white/70 border border-slate-200 rounded-2xl text-slate-600 font-sans">
                    {selectedThreat.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedThreat(null)}
                className="btn-synthex-primary px-5 py-2 rounded-full text-xs font-semibold"
              >
                Dismiss Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
