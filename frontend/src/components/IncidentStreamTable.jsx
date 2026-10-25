import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RECENT_INCIDENTS } from '../data/mockThreats';
import { reportSighting, reportFalseAlarm, verifyThreat, overrideFalsePositive } from '../api/threatApi';

export default function IncidentStreamTable({ extraThreats = [], onUpdateStatus, onRemoveThreat, userRole, refreshThreats }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

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
      numericId: t.numericId || t.numeric_id,
      severity: t.severity || (t.score >= 85 ? 'Critical' : t.score >= 60 ? 'High' : t.score >= 35 ? 'Medium' : 'Low'),
      score: t.score || 50,
      aiConfidence: t.aiConfidence || t.ai_confidence || `${Math.min(99.9, (88.0 + ((t.score || 50) * 0.11))).toFixed(1)}%`,
      indicator: t.rawInput || t.raw_input || t.indicator,
      cleanIndicator: t.indicator || t.cleanIndicator,
      type: t.type || t.indicator_type || 'URL',
      target: t.target || 'Auth Portal (443)',
      location: t.location || 'Autonomous Ingestion Node',
      status: t.status || 'Auto-Blocked',
      urgency: t.urgency || (t.score >= 85 ? 'Critical' : 'Normal'),
      sightingsCount: t.sightings_count ?? t.sightingsCount ?? 0,
      falseAlarmsCount: t.false_alarms_count ?? t.falseAlarmsCount ?? 0,
      verified: t.verified ?? false,
      timestamp: t.timestamp || 'Just now',
      sanitized: t.sanitizedParameters || t.sanitized_parameters || []
    }));
  }, [extraThreats]);

  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((item) => {
      const matchesSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        item.indicator.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesSeverity && matchesSearch;
    });
  }, [allIncidents, filterSeverity, searchQuery]);

  const handleSighting = async () => {
    if (!selectedIncident) return;
    setActionLoading('sighting');
    try {
      await reportSighting(selectedIncident.id);
      setSelectedIncident(prev => ({
        ...prev,
        sightingsCount: (prev.sightingsCount || 0) + 1,
        urgency: ((prev.sightingsCount || 0) + 1) >= 5 ? 'Critical' : prev.urgency
      }));
      if (refreshThreats) refreshThreats();
    } catch (e) {
      // Optimistic local update
      setSelectedIncident(prev => ({ ...prev, sightingsCount: (prev.sightingsCount || 0) + 1 }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleFalseAlarm = async () => {
    if (!selectedIncident) return;
    setActionLoading('falsealarm');
    try {
      await reportFalseAlarm(selectedIncident.id);
      setSelectedIncident(prev => ({ ...prev, falseAlarmsCount: (prev.falseAlarmsCount || 0) + 1 }));
      if (refreshThreats) refreshThreats();
    } catch (e) {
      setSelectedIncident(prev => ({ ...prev, falseAlarmsCount: (prev.falseAlarmsCount || 0) + 1 }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedIncident) return;
    setActionLoading('verify');
    try {
      await verifyThreat(selectedIncident.id);
      setSelectedIncident(prev => ({ ...prev, verified: true }));
      if (refreshThreats) refreshThreats();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleOverrideFP = async () => {
    if (!selectedIncident) return;
    setActionLoading('override');
    try {
      await overrideFalsePositive(selectedIncident.id);
      setSelectedIncident(prev => ({ ...prev, status: 'False Positive', verified: true }));
      if (refreshThreats) refreshThreats();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const renderSeverityBadge = (severity) => {
    const config = {
      Critical: { bg: 'bg-rose-50 text-rose-600 border-rose-200/80', dot: 'bg-rose-500 animate-pulse' },
      High: { bg: 'bg-amber-50 text-amber-600 border-amber-200/80', dot: 'bg-amber-500' },
      Medium: { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200/80', dot: 'bg-yellow-500' },
      Low: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80', dot: 'bg-emerald-500' }
    };
    const c = config[severity] || config.Low;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${c.bg} border shadow-xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
        {severity}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-[#e8ece5] shadow-xs space-y-6">

      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e8ece5] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold text-[#111315] tracking-tight font-sans flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dbf65f]"></span>
              Live Threat Stream & Incident Log
            </h3>
            <span className="text-[11px] font-sans px-3 py-0.5 rounded-full bg-[#f4f6f2] text-slate-700 font-bold border border-[#e8ece5]">
              {filteredIncidents.length} Active Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Continuous threat telemetry parsed and classified by Shield AI Neural Engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full md:w-52">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search indicator, ID, location..."
              className="w-full px-3.5 py-1.5 bg-[#f8faf7] border border-[#e8ece5] rounded-full text-xs text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div className="flex bg-[#f4f6f2] p-1 border border-[#e8ece5] rounded-full text-xs font-sans">
            {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-[#111315] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#e8ece5] bg-white shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8faf7] text-slate-700 text-[11px] font-sans uppercase font-bold tracking-wider border-b border-[#e8ece5]">
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
                    {incident.verified && <span className="ml-1 text-emerald-500" title="Verified">✓</span>}
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
                        👁 {incident.sightingsCount}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md" title="False Alarm Reports">
                        ⚠️ {incident.falseAlarmsCount}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                      className="btn-synthex-secondary px-3.5 py-1 rounded-full text-xs cursor-pointer"
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
          <div className="card-glass rounded-[28px] p-7 max-w-lg w-full space-y-5 font-sans text-xs shadow-2xl border border-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                {renderSeverityBadge(selectedIncident.severity)}
                <span className="font-sans font-bold text-slate-900 text-sm">
                  {selectedIncident.id} Forensic Telemetry
                </span>
                {selectedIncident.verified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold">✓ VERIFIED</span>
                )}
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-synthex-icon w-8 h-8 text-slate-400 hover:text-slate-800 cursor-pointer"
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

            {/* ─── RBAC Action Buttons ─── */}
            <div className="pt-3 border-t border-slate-200/60 flex flex-wrap justify-between items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Standard + Org Admin: Sightings & False Alarms */}
                {(userRole === 'standard' || userRole === 'org_admin' || userRole === 'sys_admin') && (
                  <>
                    <button
                      onClick={handleSighting}
                      disabled={actionLoading === 'sighting'}
                      className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      👁 {actionLoading === 'sighting' ? 'Reporting...' : 'I saw this too'}
                    </button>
                    <button
                      onClick={handleFalseAlarm}
                      disabled={actionLoading === 'falsealarm'}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      ⚠️ {actionLoading === 'falsealarm' ? 'Reporting...' : 'False Alarm'}
                    </button>
                  </>
                )}

                {/* Sys Admin Only: Verify, Override, Resolve, Delete */}
                {userRole === 'sys_admin' && (
                  <>
                    {!selectedIncident.verified && (
                      <button
                        onClick={handleVerify}
                        disabled={actionLoading === 'verify'}
                        className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === 'verify' ? '...' : '✓ Verify'}
                      </button>
                    )}
                    <button
                      onClick={handleOverrideFP}
                      disabled={actionLoading === 'override'}
                      className="px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === 'override' ? '...' : '⚑ False Positive'}
                    </button>
                    {onUpdateStatus && selectedIncident.status !== 'Resolved' && (
                      <button
                        onClick={async () => {
                          await onUpdateStatus(selectedIncident.id, 'Resolved');
                          setSelectedIncident(prev => ({ ...prev, status: 'Resolved' }));
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition cursor-pointer"
                      >
                        ✓ Resolve
                      </button>
                    )}
                    {onRemoveThreat && (
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
                  </>
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
