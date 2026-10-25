import { useState, useEffect } from 'react';
import { getAnalytics, checkHealth, verifyThreat, overrideFalsePositive, updateThreatStatus, deleteThreat } from '../api/threatApi';

export default function AdminPanel({ threats, onUpdateStatus, onRemoveThreat, refreshThreats }) {
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [tab, setTab] = useState('overview'); // overview | triage | telemetry

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => {});
    checkHealth().then(setHealth).catch(() => {});
  }, []);

  const addLog = (msg) => {
    setActionLog(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 20));
  };

  const handleVerify = async (id) => {
    try {
      await verifyThreat(id);
      addLog(`✓ Verified threat ${id}`);
      if (refreshThreats) refreshThreats();
    } catch (e) { addLog(`✗ Failed to verify ${id}: ${e.message}`); }
  };

  const handleOverrideFP = async (id) => {
    try {
      await overrideFalsePositive(id);
      addLog(`⚑ Override false positive: ${id}`);
      if (refreshThreats) refreshThreats();
    } catch (e) { addLog(`✗ Failed to override ${id}: ${e.message}`); }
  };

  const handleResolve = async (id) => {
    try {
      await onUpdateStatus(id, 'Resolved');
      addLog(`✓ Resolved threat ${id}`);
    } catch (e) { addLog(`✗ Failed to resolve ${id}: ${e.message}`); }
  };

  const handleDelete = async (id) => {
    try {
      await onRemoveThreat(id);
      addLog(`🗑 Deleted threat ${id}`);
    } catch (e) { addLog(`✗ Failed to delete ${id}: ${e.message}`); }
  };

  const handleEscalate = async (id) => {
    try {
      await onUpdateStatus(id, 'Investigating');
      addLog(`⬆ Escalated ${id} to Investigating`);
    } catch (e) { addLog(`✗ Failed to escalate ${id}: ${e.message}`); }
  };

  const flaggedThreats = (threats || []).filter(t => {
    const fa = t.falseAlarmsCount ?? t.false_alarms_count ?? 0;
    return fa >= 1 || t.status === 'Under Review';
  });
  const unresolvedThreats = (threats || []).filter(t => t.status !== 'Resolved' && t.status !== 'False Positive');
  const unverifiedThreats = (threats || []).filter(t => !t.verified);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs">
            ⚡ SYSTEM ADMINISTRATION
          </span>
          {health && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              health.database === 'healthy'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              DB: {health.database}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
          Admin <span className="font-serif italic font-normal text-rose-500">Control Panel</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
          Override false positives, verify threats, manage triage queue, and monitor system telemetry.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200/60 w-fit">
        {[
          { id: 'overview', label: 'System Overview' },
          { id: 'triage', label: `Triage Queue (${unresolvedThreats.length})` },
          { id: 'telemetry', label: 'Telemetry & Logs' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="card-glass rounded-[26px] p-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans block">Total Threats</span>
              <span className="text-3xl font-extrabold text-slate-900 font-sans block mt-1">{analytics?.total_threats ?? (threats || []).length}</span>
            </div>
            <div className="card-glass rounded-[26px] p-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans block">Active</span>
              <span className="text-3xl font-extrabold text-amber-600 font-sans block mt-1">{analytics?.active_threats ?? unresolvedThreats.length}</span>
            </div>
            <div className="card-glass rounded-[26px] p-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans block">Avg Score</span>
              <span className="text-3xl font-extrabold text-indigo-600 font-sans block mt-1">{analytics?.avg_score ?? '—'}</span>
            </div>
            <div className="card-glass rounded-[26px] p-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans block">Unverified</span>
              <span className="text-3xl font-extrabold text-rose-600 font-sans block mt-1">{unverifiedThreats.length}</span>
            </div>
          </div>

          {/* Flagged Reports */}
          <div className="card-glass rounded-[28px] p-7 space-y-5">
            <div className="border-b border-slate-200/60 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-sans flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Flagged Reports & False Alarm Review
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{flaggedThreats.length} threats with community false alarm reports.</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-500 text-[11px] font-sans uppercase font-bold tracking-wider border-b border-slate-200/70">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Indicator</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">False Alarms</th>
                    <th className="py-3 px-4">Sightings</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 text-xs font-sans">
                  {flaggedThreats.length === 0 ? (
                    <tr><td colSpan="7" className="py-8 text-center text-slate-400">No flagged reports.</td></tr>
                  ) : (
                    flaggedThreats.map(t => (
                      <tr key={t.id} className="hover:bg-white/80 transition">
                        <td className="py-3 px-4 font-mono text-slate-500">{t.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-800 max-w-[200px] truncate">{t.indicator || t.cleanIndicator}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.severity === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            t.severity === 'High' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>{t.severity}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-600">{t.falseAlarmsCount ?? t.false_alarms_count ?? 0}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600">{t.sightingsCount ?? t.sightings_count ?? 0}</td>
                        <td className="py-3 px-4 text-xs">{t.status}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={() => handleOverrideFP(t.id)} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[10px] font-bold transition cursor-pointer">
                              False Positive
                            </button>
                            <button onClick={() => handleVerify(t.id)} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold transition cursor-pointer">
                              ✓ Verify
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[10px] font-bold transition cursor-pointer">
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRIAGE TAB ─── */}
      {tab === 'triage' && (
        <div className="card-glass rounded-[28px] p-7 space-y-5">
          <div className="border-b border-slate-200/60 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 font-sans">Active Triage Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review, verify, escalate, or resolve each threat incident.</p>
          </div>
          <div className="space-y-3">
            {unresolvedThreats.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">All threats resolved — queue is empty.</div>
            ) : (
              unresolvedThreats.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-white/70 border border-slate-200 hover:border-slate-300 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.severity === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' :
                        t.severity === 'High' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        t.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>{t.severity}</span>
                      <span className="font-mono text-xs text-slate-500 font-medium">{t.id}</span>
                      <span className="text-xs text-slate-800 font-bold truncate max-w-xs">{t.indicator || t.cleanIndicator}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">{t.type}</span>
                      <span className="font-mono font-bold text-indigo-600">{t.score}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-500">Status: <strong className="text-slate-800">{t.status}</strong></span>
                    <span className="text-slate-500">Sightings: <strong className="text-indigo-600">{t.sightingsCount ?? t.sightings_count ?? 0}</strong></span>
                    <span className="text-slate-500">False Alarms: <strong className="text-amber-600">{t.falseAlarmsCount ?? t.false_alarms_count ?? 0}</strong></span>
                    {t.verified && <span className="text-emerald-600 font-bold">✓ Verified</span>}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    {!t.verified && (
                      <button onClick={() => handleVerify(t.id)} className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition cursor-pointer">
                        ✓ Verify Threat
                      </button>
                    )}
                    <button onClick={() => handleEscalate(t.id)} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-[11px] font-semibold transition cursor-pointer">
                      ⬆ Escalate
                    </button>
                    <button onClick={() => handleResolve(t.id)} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-[11px] font-semibold transition cursor-pointer">
                      ✓ Resolve
                    </button>
                    <button onClick={() => handleOverrideFP(t.id)} className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11px] font-semibold transition cursor-pointer">
                      ⚑ False Positive
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-semibold transition cursor-pointer">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TELEMETRY TAB ─── */}
      {tab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="card-glass rounded-[28px] p-7 space-y-5">
            <div className="border-b border-slate-200/60 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 font-sans">System Health</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/60 border border-slate-200">
                <span className="font-semibold text-slate-600">Database Status</span>
                <span className={`font-bold ${health?.database === 'healthy' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {health?.database || 'checking...'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/60 border border-slate-200">
                <span className="font-semibold text-slate-600">API Status</span>
                <span className="font-bold text-emerald-600">{health?.status || 'checking...'}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/60 border border-slate-200">
                <span className="font-semibold text-slate-600">Last Updated</span>
                <span className="font-mono text-slate-500 text-[11px]">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}</span>
              </div>

              {analytics && (
                <>
                  <div className="pt-3 border-t border-slate-200/60 space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Severity Distribution</h4>
                    {Object.entries(analytics.threat_levels || {}).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">{level}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200/70 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                level === 'Critical' ? 'bg-rose-500' : level === 'High' ? 'bg-amber-500' : level === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (count / (analytics.total_threats || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Distribution</h4>
                    {Object.entries(analytics.statuses || {}).map(([st, count]) => (
                      <div key={st} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">{st}</span>
                        <span className="font-bold text-slate-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Log */}
          <div className="card-glass rounded-[28px] p-7 space-y-5">
            <div className="border-b border-slate-200/60 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-sans">Admin Action Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Recent administrative actions in this session.</p>
              </div>
              <button onClick={() => setActionLog([])} className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer font-bold">Clear</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {actionLog.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No actions yet. Use the triage queue to manage threats.</p>
              ) : (
                actionLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/60 border border-slate-100 text-xs">
                    <span className="font-mono text-slate-400 text-[10px] shrink-0 mt-0.5">{entry.time}</span>
                    <span className="text-slate-700">{entry.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
