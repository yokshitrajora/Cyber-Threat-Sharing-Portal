import { useState, useMemo } from 'react';

export default function TelemetryLog({ threats = [], onRefresh, loading, error }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [density, setDensity] = useState('detailed'); // 'compact' | 'detailed'
  const [selectedThreat, setSelectedThreat] = useState(null);

  // Filtered threats based on query & category
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
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        scoreText: 'text-rose-400'
      };
    }
    if (score >= 40) {
      return {
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        scoreText: 'text-amber-400'
      };
    }
    return {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      scoreText: 'text-emerald-400'
    };
  };

  return (
    <div className="card-3d rounded-2xl p-6 space-y-4 font-sans text-xs">
      
      {/* Telemetry Log Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-sans">
            Telemetry Stream & Indicator Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time log of anonymized threat indicators stored in SQLite database.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Data Density Toggle */}
          <div className="flex bg-black/40 p-1 border border-white/15 rounded-xl backdrop-blur-md">
            <button
              onClick={() => setDensity('detailed')}
              className={`px-3 py-1 text-[11px] rounded-lg transition-all ${
                density === 'detailed' ? 'btn-3d-primary py-0.5 px-2.5 text-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-3 py-1 text-[11px] rounded-lg transition-all ${
                density === 'compact' ? 'btn-3d-primary py-0.5 px-2.5 text-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Compact
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-3d-secondary px-3.5 py-1.5 rounded-xl text-xs shrink-0 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Log'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicator string, domain, or notes..."
            className="w-full px-3.5 py-2 input-3d rounded-xl text-white placeholder-slate-400 outline-none text-xs font-sans"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900/80 border border-white/15 rounded-xl text-slate-200 outline-none focus:border-white/40 text-xs font-sans backdrop-blur-md"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-neutral-900 text-white">
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Data Display */}
      {loading ? (
        <div className="p-10 text-center bg-black/40 rounded-xl border border-white/10 text-slate-400 backdrop-blur-md">
          Fetching telemetry records...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/40 border border-rose-400/40 text-rose-300 rounded-xl space-y-2 backdrop-blur-md">
          <p className="font-bold">Database Error: {error}</p>
          <button
            onClick={onRefresh}
            className="btn-3d-primary px-3 py-1 rounded-lg text-xs font-sans"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredThreats.length === 0 ? (
        <div className="p-10 text-center bg-black/40 rounded-xl border border-white/10 text-slate-400 backdrop-blur-md">
          No threat indicators match the specified query filters.
        </div>
      ) : density === 'compact' ? (
        /* Compact Table Layout */
        <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/30 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-300 text-[11px] font-sans font-bold uppercase tracking-wider border-b border-white/10">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Indicator String</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-sans">
              {filteredThreats.map((threat) => {
                const style = getRiskBadgeStyle(threat.score);
                return (
                  <tr 
                    key={threat.id}
                    onClick={() => setSelectedThreat(threat)}
                    className="hover:bg-white/[0.06] cursor-pointer transition-all"
                  >
                    <td className="p-3.5 text-slate-400 font-mono">{threat.id}</td>
                    <td className="p-3.5 text-white font-medium">{threat.type}</td>
                    <td className="p-3.5 text-white font-mono font-medium max-w-xs truncate">
                      {threat.indicator}
                    </td>
                    <td className="p-3.5 text-slate-400 text-xs">{threat.timestamp}</td>
                    <td className={`p-3.5 text-right font-mono font-bold ${style.scoreText}`}>
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
        <div className="space-y-2.5">
          {filteredThreats.map((threat) => {
            const style = getRiskBadgeStyle(threat.score);
            return (
              <div
                key={threat.id}
                onClick={() => setSelectedThreat(threat)}
                className="p-4 bg-black/40 border border-white/10 rounded-xl hover:border-white/25 backdrop-blur-md transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-white/10 to-white/5 border border-white/15 text-white font-medium">
                      {threat.type}
                    </span>
                    <span className="text-slate-400 text-xs">{threat.timestamp}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${style.badge}`}>
                      {threat.status || (threat.score >= 80 ? 'RED' : threat.score >= 40 ? 'YELLOW' : 'GREEN')}
                    </span>
                  </div>

                  <p className="text-sm font-mono font-medium text-white break-all group-hover:text-slate-200 transition mt-1">
                    {threat.indicator}
                  </p>

                  {threat.description && (
                    <p className="text-xs text-slate-400 font-sans italic">
                      "{threat.description}"
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className={`text-xl font-bold font-mono ${style.scoreText}`}>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="card-3d rounded-2xl p-6 max-w-lg w-full space-y-4 font-sans text-xs shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="font-bold text-white uppercase text-sm font-sans">
                [INSPECTOR] Indicator Breakdown #{selectedThreat.id}
              </span>
              <button
                onClick={() => setSelectedThreat(null)}
                className="btn-3d-secondary p-1 rounded-lg text-xs w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Indicator String</span>
                <p className="p-3 bg-black/60 border border-white/15 rounded-xl text-white font-mono break-all font-bold text-xs">
                  {selectedThreat.indicator}
                </p>
              </div>

              {selectedThreat.rawInput && selectedThreat.rawInput !== selectedThreat.indicator && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Raw Input (Pre-Sanitization)</span>
                  <p className="p-3 bg-black/60 border border-white/15 rounded-xl text-rose-300 font-mono break-all text-xs">
                    {selectedThreat.rawInput}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Risk Score</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedThreat.score}/100</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Threat Category</span>
                  <span className="text-sm font-bold text-slate-200">{selectedThreat.type}</span>
                </div>
              </div>

              {selectedThreat.description && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Context Note</span>
                  <p className="p-3 bg-black/60 border border-white/15 rounded-xl text-slate-300 font-sans">
                    {selectedThreat.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedThreat(null)}
                className="btn-3d-primary px-4 py-2 rounded-full text-xs font-sans font-semibold"
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
