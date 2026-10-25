import { useState, useEffect } from 'react';
import { getAnalytics, getExportUrl, downloadThreatExport, broadcastEmergencyAlert } from '../api/threatApi';
import WeeklyEmailDigestPanel from '../components/WeeklyEmailDigestPanel';
import InteractiveThreatMap from '../components/InteractiveThreatMap';

export default function OrgDashboard({ threats, userRole }) {
  const [analytics, setAnalytics] = useState(null);
  const [alertForm, setAlertForm] = useState({ title: '', message: '' });
  const [alertStatus, setAlertStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const verifiedThreats = (threats || []).filter(t => t.verified);
  const criticalThreats = (threats || []).filter(t => t.severity === 'Critical' || t.score >= 85);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      await downloadThreatExport(format);
    } catch {
      window.open(getExportUrl(format), '_blank');
    } finally {
      setExporting(null);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!alertForm.title.trim() || !alertForm.message.trim()) return;
    setSending(true);
    setAlertStatus(null);
    try {
      const result = await broadcastEmergencyAlert({
        title: alertForm.title,
        message: alertForm.message,
        severity: 'Critical'
      });
      setAlertStatus({ type: 'success', text: `Emergency alert broadcast sent by ${result.dispatched_by}` });
      setAlertForm({ title: '', message: '' });
    } catch (err) {
      setAlertStatus({ type: 'error', text: err.message || 'Failed to send broadcast' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 shadow-2xs">
            🏢 ORGANIZATION DASHBOARD
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
          Organization <span className="font-serif italic font-normal text-purple-500">Command Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
          Export verified threat indicators, monitor critical alerts, and broadcast emergency notifications.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Verified Threats</span>
          <span className="text-3xl font-extrabold text-emerald-600 font-sans block">{analytics?.verified_count ?? verifiedThreats.length}</span>
          <span className="text-[11px] text-slate-400">Analyst-confirmed indicators</span>
        </div>
        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Critical Active</span>
          <span className="text-3xl font-extrabold text-rose-600 font-sans block">{analytics?.critical_threats ?? criticalThreats.length}</span>
          <span className="text-[11px] text-slate-400">Requiring immediate action</span>
        </div>
        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Community Sightings</span>
          <span className="text-3xl font-extrabold text-indigo-600 font-sans block">{analytics?.sightings_total ?? 0}</span>
          <span className="text-[11px] text-slate-400">Total confirmations</span>
        </div>
        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">False Alarms</span>
          <span className="text-3xl font-extrabold text-amber-600 font-sans block">{analytics?.false_alarms_total ?? 0}</span>
          <span className="text-[11px] text-slate-400">Community-reported</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Panel */}
        <div className="card-glass rounded-[28px] p-7 space-y-5">
          <div className="border-b border-slate-200/60 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 font-sans">Export Threat Intelligence</h3>
            <p className="text-xs text-slate-500 mt-0.5">Download verified threat indicators for network defense integration.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50/60 border border-blue-200 hover:bg-blue-50 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">📊</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-900 block">CSV Spreadsheet</span>
                  <span className="text-[11px] text-slate-500">Structured columns for SIEM ingestion</span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">Download →</span>
            </button>

            <button
              onClick={() => handleExport('stix')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-purple-50/60 border border-purple-200 hover:bg-purple-50 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">🔐</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-900 block">STIX 2.1 Bundle</span>
                  <span className="text-[11px] text-slate-500">Standardized threat intelligence exchange</span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">Download →</span>
            </button>

            <button
              onClick={() => handleExport('hosts')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:bg-emerald-50 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">🛡️</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-900 block">Hosts Blocklist</span>
                  <span className="text-[11px] text-slate-500">DNS sinkhole / hosts file format</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">Download →</span>
            </button>
          </div>
        </div>

        {/* Emergency Alert Broadcast */}
        <div className="card-glass rounded-[28px] p-7 space-y-5">
          <div className="border-b border-slate-200/60 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 font-sans flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Emergency Alert Broadcast
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Send critical threat notifications to all connected SOC operators.</p>
          </div>

          {alertStatus && (
            <div className={`p-3 rounded-xl text-xs font-sans ${
              alertStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {alertStatus.type === 'success' ? '✓' : '⚠️'} {alertStatus.text}
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Alert Title</label>
              <input
                type="text"
                value={alertForm.title}
                onChange={(e) => setAlertForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                placeholder="Critical security advisory headline..."
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Alert Message</label>
              <textarea
                value={alertForm.message}
                onChange={(e) => setAlertForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans resize-none"
                placeholder="Detailed emergency threat information..."
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full px-4 py-3 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Broadcasting...
                </>
              ) : (
                <>🚨 Broadcast Emergency Alert</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Critical Threats Quick View */}
      <div className="card-glass rounded-[28px] p-7 space-y-5">
        <div className="border-b border-slate-200/60 pb-4">
          <h3 className="text-base font-extrabold text-slate-900 font-sans">Critical Threat Watchlist</h3>
          <p className="text-xs text-slate-500 mt-0.5">{criticalThreats.length} critical indicators requiring organizational response.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/60 text-slate-500 text-[11px] font-sans uppercase font-bold tracking-wider border-b border-slate-200/70">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Indicator</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sightings</th>
                <th className="py-3 px-4">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 text-xs font-sans">
              {criticalThreats.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-400">No critical threats currently.</td></tr>
              ) : (
                criticalThreats.slice(0, 10).map(t => (
                  <tr key={t.id} className="hover:bg-white/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">{t.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-800 max-w-xs truncate">{t.indicator || t.cleanIndicator}</td>
                    <td className="py-3 px-4">{t.type}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{t.score}/100</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">{t.status}</span>
                    </td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">{t.sightingsCount ?? t.sightings_count ?? 0}</td>
                    <td className="py-3 px-4">
                      {(t.verified) ? (
                        <span className="text-emerald-600 font-bold">✓ Yes</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Community Threat Email Digest */}
      <WeeklyEmailDigestPanel userRole={userRole} />

      {/* Interactive Threat Origin Map */}
      <InteractiveThreatMap />
    </div>
  );
}
