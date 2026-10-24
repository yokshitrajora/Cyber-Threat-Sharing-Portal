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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Low
          </span>
        );
    }
  };

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-7 space-y-6">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Live Threat Stream & Incident Log
            </h3>
            <span className="text-[11px] font-sans px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {filteredIncidents.length} Active Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Continuous threat telemetry parsed and classified by Shield AI Neural Engine.
          </p>
        </div>

        {/* Filter Controls & Exports */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Export Actions for Org Admin and Sys Admin */}
          {(userRole === 'org_admin' || userRole === 'sys_admin') && (
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden md:inline">Export:</span>
              <button 
                onClick={() => window.open('http://127.0.0.1:8001/api/v1/threats/export/rules?format=csv', '_blank')} 
                className="px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 text-[10px] font-bold transition shadow-xs cursor-pointer"
              >
                CSV
              </button>
              <button 
                onClick={() => window.open('http://127.0.0.1:8001/api/v1/threats/export/rules?format=stix', '_blank')} 
                className="px-2.5 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 text-[10px] font-bold transition shadow-xs cursor-pointer"
              >
                STIX 2.1
              </button>
              <button 
                onClick={() => window.open('http://127.0.0.1:8001/api/v1/threats/export/rules?format=hosts', '_blank')} 
                className="px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 text-[10px] font-bold transition shadow-xs cursor-pointer"
              >
                Hosts
              </button>
            </div>
          )}

          <div className="relative w-full md:w-52">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search indicator, ID, location..."
              className="w-full px-3.5 py-1.5 input-synthex rounded-full text-xs text-slate-800 placeholder-slate-400 font-sans"
            />
          </div>

          <div className="pill-group">
            {['ALL', 'Critical', 'High', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterSeverity === sev 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/50 backdrop-blur-md shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/60 text-slate-500 text-[11px] font-sans uppercase font-bold tracking-wider border-b border-slate-200/70">
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Incident ID</th>
              <th className="py-3.5 px-4">Indicator String</th>
              <th className="py-3.5 px-4">Vector Type</th>
              <th className="py-3.5 px-4">Target Node</th>
              <th className="py-3.5 px-4">Origin / Geo</th>
              <th className="py-3.5 px-4">AI Confidence</th>
              <th className="py-3.5 px-4">Feedback</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 text-xs font-sans">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 px-4 text-center text-slate-400 font-sans">
                  No threat incidents match the selected search criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="hover:bg-white/80 cursor-pointer transition-all duration-150 group"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderSeverityBadge(incident.severity)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 font-medium text-xs whitespace-nowrap">
                    {incident.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800 max-w-xs truncate group-hover:text-indigo-600 transition">
                    {incident.indicator}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-700 font-sans font-semibold text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      {incident.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-sans text-xs">
                    {incident.target}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-sans text-xs">
                    {incident.location}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-indigo-600 font-bold text-xs bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md inline-block">
                      {incident.aiConfidence}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md" title="Community Sightings">
                        👁 {incident.sightingsCount || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md" title="False Alarm Reports">
                        ⚠️ {incident.falseAlarmsCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                      className="btn-synthex-secondary px-3.5 py-1 rounded-full text-xs"
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
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card-glass rounded-[28px] p-7 max-w-lg w-full space-y-5 font-sans text-xs shadow-2xl border border-white">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                {renderSeverityBadge(selectedIncident.severity)}
                <span className="font-sans font-bold text-slate-900 text-sm">
                  {selectedIncident.id} Forensic Telemetry
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-synthex-icon w-8 h-8 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 font-sans">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Target Indicator String</span>
                <p className="p-3 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 font-mono break-all font-bold text-xs shadow-2xs">
                  {selectedIncident.indicator}
                </p>
              </div>

              {selectedIncident.cleanIndicator && selectedIncident.cleanIndicator !== selectedIncident.indicator && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Sanitized Output String</span>
                  <p className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-emerald-800 font-mono break-all text-xs">
                    {selectedIncident.cleanIndicator}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Risk Rating</span>
                  <span className="text-xl font-bold text-slate-900 font-sans">{selectedIncident.score}/100</span>
                </div>
                <div className="p-3.5 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">AI Model Confidence</span>
                  <span className="text-xl font-bold text-indigo-600 font-sans">{selectedIncident.aiConfidence}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Urgency</span>
                  <span className={`text-xs font-bold ${selectedIncident.urgency === 'Critical' ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                    {selectedIncident.urgency}
                  </span>
                </div>
                <div className="p-3 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sightings</span>
                  <span className="text-xs font-bold text-indigo-600">
                    {selectedIncident.sightingsCount} Confirmations
                  </span>
                </div>
                <div className="p-3 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">False Alarms</span>
                  <span className="text-xs font-bold text-slate-600">
                    {selectedIncident.falseAlarmsCount} Reports
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Vector Category</span>
                  <span className="text-xs font-bold text-slate-800">{selectedIncident.type}</span>
                </div>
                <div className="p-3.5 bg-white/70 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Action Taken</span>
                  <span className="text-xs font-bold text-rose-600">{selectedIncident.status}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex flex-wrap justify-between items-center gap-2">
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
                      className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
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
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
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
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition cursor-pointer"
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
                    className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-semibold transition cursor-pointer"
                  >
                    🗑 Remove
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-synthex-secondary px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
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
