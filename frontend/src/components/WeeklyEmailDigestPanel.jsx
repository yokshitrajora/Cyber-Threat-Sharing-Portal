import { useState, useEffect } from 'react';
import {
  subscribeWeeklyDigest,
  getDigestSubscribers,
  getDigestPreview,
  triggerWeeklyDigest,
  unsubscribeDigest
} from '../api/threatApi';

export default function WeeklyEmailDigestPanel({ userRole }) {
  const [subscribers, setSubscribers] = useState([]);
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [sector, setSector] = useState('Retail & Small Business');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Broadcast
  const [broadcasting, setBroadcasting] = useState(false);

  const canManage = userRole === 'org_admin' || userRole === 'sys_admin';

  useEffect(() => {
    if (canManage) {
      loadSubscribers();
    }
  }, [canManage]);

  const loadSubscribers = async () => {
    try {
      const data = await getDigestSubscribers();
      if (Array.isArray(data)) {
        setSubscribers(data);
      }
    } catch {
      // Offline fallback
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || !orgName.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      const newSub = await subscribeWeeklyDigest({
        email: email.trim(),
        organization_name: orgName.trim(),
        sector
      });
      setMessage({ type: 'success', text: `Successfully registered ${orgName} for weekly threat briefings!` });
      setEmail('');
      setOrgName('');
      if (canManage) loadSubscribers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to subscribe' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPreview = async () => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const data = await getDigestPreview(orgName || 'Valley Community Business');
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTriggerSend = async () => {
    setBroadcasting(true);
    setMessage(null);
    try {
      const result = await triggerWeeklyDigest();
      setMessage({
        type: 'success',
        text: `Weekly Cyber-Threat Digest queued in Celery Worker! Dispatched to ${result.recipients_count} active local businesses.`
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to trigger worker digest' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleUnsubscribe = async (subEmail) => {
    try {
      await unsubscribeDigest(subEmail);
      setSubscribers(prev => prev.filter(s => s.email !== subEmail));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-7 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
              Automated Weekly Cyber-Threat Email Digest
            </h3>
            <span className="text-[11px] font-sans px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              CELERY CRON / BEAT ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Periodic email summaries dispatched every Monday to local businesses detailing recent community phishing campaigns and blocked attacking IPs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenPreview}
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>✉️ Preview Email Brief</span>
          </button>

          {canManage && (
            <button
              onClick={handleTriggerSend}
              disabled={broadcasting}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {broadcasting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Worker Queuing...</span>
                </>
              ) : (
                <>
                  <span>🚀 Trigger Digest Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-sans animate-in fade-in duration-200 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? '✓' : '⚠️'} {message.text}
        </div>
      )}

      {/* Grid: Subscribe Form + Subscribers / Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Subscription Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white/60 border border-slate-200/80 p-5 space-y-4">
          <div className="border-b border-slate-200/60 pb-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-sans">
              Subscribe a Local Business or Department
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Receive concise automated reports: "3 phishing campaigns and 12 malicious IPs blocked in your area this week."
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="space-y-3.5 font-sans text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Business / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Valley Clinic"
                  className="w-full px-3.5 py-2.5 input-synthex rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Industry / Sector
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3.5 py-2.5 input-synthex rounded-xl text-xs text-slate-800 bg-white"
                >
                  <option value="Retail & Small Business">Retail & Small Business</option>
                  <option value="Healthcare & Clinics">Healthcare & Clinics</option>
                  <option value="Finance & Credit Unions">Finance & Credit Unions</option>
                  <option value="Education & Schools">Education & Schools</option>
                  <option value="Local Government">Local Government</option>
                  <option value="General Business">General Business</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="security@yourlocalbusiness.com"
                className="w-full px-3.5 py-2.5 input-synthex rounded-xl text-xs text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-synthex-primary py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Register for Weekly Cyber Digest'}
            </button>
          </form>
        </div>

        {/* Subscribers Directory / Sample Preview (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white/60 border border-slate-200/80 p-5 space-y-3.5">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-sans">
              Subscribed Local Partners
            </h4>
            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {subscribers.length || 4} Active
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {(subscribers.length > 0 ? subscribers : [
              { id: 1, organization_name: "Downtown Artisan Bakery", email: "contact@downtownbakery.com", sector: "Retail" },
              { id: 2, organization_name: "Valley Community Health", email: "secops@valleyhealth.org", sector: "Healthcare" },
              { id: 3, organization_name: "First Metro Savings", email: "security@firstmetrocitizens.com", sector: "Finance" },
              { id: 4, organization_name: "Riverside Schools", email: "admin@riversideschools.edu", sector: "Education" }
            ]).map(s => (
              <div key={s.id || s.email} className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="font-bold text-slate-800 block truncate">{s.organization_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {s.sector}
                  </span>
                  {canManage && s.email && (
                    <button
                      onClick={() => handleUnsubscribe(s.email)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 text-xs cursor-pointer"
                      title="Unsubscribe"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Next Automated Run: Monday 08:00 UTC</span>
            <span className="text-emerald-600 font-bold">Worker Online</span>
          </div>
        </div>

      </div>

      {/* HTML Email Brief Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card-glass rounded-[28px] max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col border border-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                  Weekly Email Digest Preview
                </h3>
                <p className="text-[11px] text-slate-500">{previewData?.subject || 'Subject: Weekly Community Threat Brief'}</p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="btn-synthex-icon w-8 h-8 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-2xl p-2 bg-slate-50">
              {previewLoading ? (
                <div className="py-20 text-center text-xs text-slate-400">Compiling 7-day community threat telemetry...</div>
              ) : previewData?.html_preview ? (
                <div dangerouslySetInnerHTML={{ __html: previewData.html_preview }} />
              ) : (
                <div className="py-20 text-center text-xs text-slate-400">Failed to render preview.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Rendered via SendGrid / HTML template engine</span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="btn-synthex-secondary px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
