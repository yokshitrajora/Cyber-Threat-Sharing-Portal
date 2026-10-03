import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RECENT_INCIDENTS } from '../data/mockThreats';

export default function IncidentStreamTable({ extraThreats = [], onUpdateStatus, onRemoveThreat, userRole }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Sync state if URL query parameter changes
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('search', val);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Combine default incident dataset with user-submitted threats or direct live server threats
  const allIncidents = useMemo(() => {
    const raw = (extraThreats && extraThreats.length > 0) ? extraThreats : RECENT_INCIDENTS;
    return raw.map(t => ({
      ...t,
      id: t.id || t.incident_code || `INC-${Math.floor(Math.random()*9000)+1000}`,
      numericId: t.numericId,
      severity: t.severity || (t.score >= 85 ? 'Critical' : t.score >= 60 ? 'High' : t.score >= 35 ? 'Medium' : 'Low'),
      score: t.score || 50,
      aiConfidence: t.aiConfidence || `${Math.min(99.9, (88.0 + ((t.score || 50) * 0.11))).toFixed(1)}%`,
      indicator: t.rawInput || t.indicator,
      cleanIndicator: t.indicator,
      type: t.type || 'URL',
      target: t.target || 'Auth Portal (443)',
      location: t.location || 'Autonomous Ingestion Node',
      status: t.status || 'Auto-Blocked',
      urgency: t.urgency || (t.score >= 85 ? 'Critical' : 'Normal'),
      sightingsCount: t.sightings_count !== undefined ? t.sightings_count : (t.sightingsCount !== undefined ? t.sightingsCount : Math.floor(Math.random() * 8)),
      falseAlarmsCount: t.false_alarms_count !== undefined ? t.false_alarms_count : (t.falseAlarmsCount || 0),
      timestamp: t.timestamp || 'Just now',
      sanitized: t.sanitizedParameters || []
    }));
  }, [extraThreats]);

  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((item) => {
      const matchesSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
      const matchesSearch = 
        item.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [allIncidents, filterSeverity, searchQuery]);

  const renderSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Low
          </span>
        );
    }
  };

  return (
    <div className="card-3d rounded-2xl p-6 space-y-5">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Live Threat Stream & Incident Log
            </h3>
            <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30">
              {filteredIncidents.length} Logged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">Real-time crowdsourced telemetry scored by neural analysis model.</p>
        </div>

        {/* Filter Controls & Exports */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Export Actions */}
          {(userRole === 'org_admin' || userRole === 'sys_admin') && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden md:inline">Export:</span>
              <button onClick={() => window.open('http://127.0.0.1:8001/api/v1/threats/export/rules?format=csv', '_blank')} className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 text-[10px] font-bold transition">CSV</button>
              <button onClick={() => window.open('http://127.0.0.1:8001/api/v1/threats/export/rules?format=stix', '_blank')} className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 text-[10px] font-bold transition">STIX 2.1</button>
              <button onClick={() => window.open('http://127.0.0.1:8001/api/v1/threats/export/rules?format=hosts', '_blank')} className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold transition">Hosts File</button>
            </div>
          )}

          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search indicator, ID, location, type..."
            className="px-3.5 py-2 input-3d rounded-xl text-xs text-white placeholder-slate-400 outline-none font-sans w-full md:w-48"
          />

          <div className="flex bg-black/50 p-1 border border-white/15 rounded-xl text-xs font-sans backdrop-blur-md shadow-inner">
            {['ALL', 'Critical', 'High', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  filterSeverity === sev 
                    ? 'btn-3d-primary py-0.5 px-3 text-xs font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="border border-white/10 rounded-xl bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.04] text-slate-400 text-[10px] font-sans uppercase font-bold tracking-wider border-b border-white/10">
              <th className="py-3 px-2">Severity</th>
              <th className="py-3 px-2">ID</th>
              <th className="py-3 px-2">Indicator</th>
              <th className="py-3 px-2">Type</th>
              <th className="py-3 px-2">Target</th>
              <th className="py-3 px-2">Origin</th>
              <th className="py-3 px-2">AI %</th>
              <th className="py-3 px-2">Feedback</th>
              <th className="py-3 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-sans">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-10 px-4 text-center text-slate-400 font-sans">
                  No threat incidents match the selected search criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="hover:bg-white/[0.06] cursor-pointer transition-all duration-150 group"
                >
                  <td className="py-3 px-2 whitespace-nowrap">
                    {renderSeverityBadge(incident.severity)}
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-400 font-medium text-[11px] whitespace-nowrap">
                    {incident.id}
                  </td>
                  <td className="py-3 px-2 font-mono font-medium text-slate-100 max-w-[200px] truncate group-hover:text-white transition text-[11px]">
                    {incident.indicator}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span className="text-slate-200 font-sans font-medium text-[10px] px-2 py-0.5 rounded-lg bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-xs">
                      {incident.type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-300 whitespace-nowrap font-sans text-[11px] truncate">
                    {incident.target}
                  </td>
                  <td className="py-3 px-2 text-slate-400 whitespace-nowrap font-sans text-[11px] truncate">
                    {incident.location}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span className="font-mono text-emerald-400 font-bold text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md inline-block">
                      {incident.aiConfidence}
                    </span>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md" title="Community Sightings">
                        👁 {incident.sightingsCount || 0}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md" title="False Alarm Reports">
                        ⚠ {incident.falseAlarmsCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                      className="btn-3d-secondary px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium text-slate-200 hover:text-white"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Forensic Inspection Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="card-3d rounded-2xl p-6 max-w-lg w-full space-y-4 font-sans text-xs shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                {renderSeverityBadge(selectedIncident.severity)}
                <span className="font-sans font-bold text-white text-sm">
                  {selectedIncident.id} Forensic Telemetry
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-3d-secondary p-1 rounded-lg text-sm w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Target Indicator String</span>
                <p className="p-3 bg-black/60 border border-white/15 rounded-xl text-white font-mono break-all font-bold text-xs">
                  {selectedIncident.indicator}
                </p>
              </div>

              {selectedIncident.cleanIndicator && selectedIncident.cleanIndicator !== selectedIncident.indicator && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Sanitized Output String</span>
                  <p className="p-3 bg-black/60 border border-white/15 rounded-xl text-emerald-300 font-mono break-all text-xs">
                    {selectedIncident.cleanIndicator}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Risk Rating</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedIncident.score}/100</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">AI Model Confidence</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{selectedIncident.aiConfidence}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Urgency Level</span>
                  <span className={`text-xs font-bold ${selectedIncident.urgency === 'Critical' ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>{selectedIncident.urgency}</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">"I Saw This Too"</span>
                  <span className="text-xs font-bold text-amber-400">{selectedIncident.sightingsCount} Confirmations</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">False Alarms</span>
                  <span className="text-xs font-bold text-slate-400">{selectedIncident.falseAlarmsCount} Reports</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Vector Category</span>
                  <span className="text-xs font-bold text-slate-200">{selectedIncident.type}</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/15 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Action Taken</span>
                  <span className="text-xs font-bold text-rose-300">{selectedIncident.status}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                {(userRole === 'standard' || userRole === 'org_admin') && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`http://127.0.0.1:8001/api/v1/threats/${selectedIncident.id}/sightings`, { method: 'POST' });
                          setSelectedIncident(prev => ({ 
                            ...prev, 
                            sightingsCount: prev.sightingsCount + 1,
                            urgency: (prev.sightingsCount + 1) >= 5 ? 'Critical' : prev.urgency
                          }));
                        } catch (e) { console.error(e); }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      👁 I saw this too
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`http://127.0.0.1:8001/api/v1/threats/${selectedIncident.id}/false-alarms`, { method: 'POST' });
                          setSelectedIncident(prev => ({ ...prev, falseAlarmsCount: prev.falseAlarmsCount + 1 }));
                        } catch (e) { console.error(e); }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      ⚠️ False Alarm
                    </button>
                  </>
                )}
                
                {userRole === 'sys_admin' && onUpdateStatus && selectedIncident.status !== 'Resolved' && (
                  <button
                    onClick={async () => {
                      await onUpdateStatus(selectedIncident.id, 'Resolved');
                      setSelectedIncident(prev => ({ ...prev, status: 'Resolved' }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-[11px] font-semibold transition ml-2"
                  >
                    ✓ Mark Resolved
                  </button>
                )}
                {userRole === 'sys_admin' && onRemoveThreat && (
                  <button
                    onClick={async () => {
                      await onRemoveThreat(selectedIncident.id);
                      setSelectedIncident(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-[11px] font-semibold transition"
                  >
                    🗑 Remove
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-3d-secondary px-4 py-1.5 rounded-xl text-xs font-medium"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
