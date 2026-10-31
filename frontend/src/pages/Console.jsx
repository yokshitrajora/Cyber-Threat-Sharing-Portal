import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MetricCards from '../components/MetricCards';
import ThreatTimelineChart from '../components/ThreatTimelineChart';
import RiskDistributionChart from '../components/RiskDistributionChart';
import IncidentStreamTable from '../components/IncidentStreamTable';
import InspectionPanel from '../components/InspectionPanel';
import InteractiveThreatMap from '../components/InteractiveThreatMap';
import WeeklyEmailDigestPanel from '../components/WeeklyEmailDigestPanel';
import AnalyticsView from '../components/AnalyticsView';
import SiemRulesView from '../components/SiemRulesView';
import OrgDashboard from './OrgDashboard';

export default function Console({ threats = [], onUpdateStatus, onRemoveThreat, isLiveConnected, userRole, refreshThreats }) {
  const [activeTab, setActiveTab] = useState('Organization');
  const [activeModal, setActiveModal] = useState(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If Org Admin, render the specialized Enterprise Org Dashboard on overview
  if (userRole === 'org_admin') {
    return <OrgDashboard threats={threats} userRole={userRole} />;
  }

  // Common Header & Pill Tabs (Matching Reference UI)
  const renderHeader = (isSysAdmin = false) => (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#e8ece5] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e8ece5] text-slate-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dbf65f] shadow-[0_0_6px_#dbf65f]"></span>
              {isSysAdmin ? '⚡ AUTONOMOUS SOC COMMAND' : '👤 COMMUNITY DEFENSE PORTAL'}
            </span>
            <span className="text-slate-400">• TIER {isSysAdmin ? '3' : '1'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111315] tracking-tight font-sans leading-tight">
            Managing Your Team<br />
            and Workflows
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#e8ece5] text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-[#dbf65f]' : 'bg-amber-400'}`}></span>
            <span>{isLiveConnected ? 'Neural Engine Active' : 'Edge Sensor Cache'}</span>
          </div>
          <button
            onClick={() => {
              setActiveTab('Organization');
              setTimeout(() => {
                const el = document.getElementById('indicator-scanner-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-[#111315] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <span className="text-[#dbf65f] font-mono text-sm leading-none">+</span>
            <span>Create a New Scenario</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tab / Pill Bar (from Reference UI) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['Organization', 'Threat Feed', 'Analytics', 'Geospatial Map', 'Email Digest', 'SIEM Rules'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab
                ? 'bg-[#111315] text-white shadow-xs'
                : 'bg-white hover:bg-[#f2f5ef] text-slate-600 border border-[#e8ece5]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  // Common Right-Side Action & Resource Cards (from Reference UI) - Now fully interactive!
  const renderRightSidebarCards = () => (
    <div className="space-y-4">
      {/* Top 2 Action Cards (Community & Academy from Reference UI) */}
      <div className="grid grid-cols-2 gap-3.5">
        <div
          onClick={() => setActiveModal('community')}
          className="bg-white rounded-3xl p-5 border border-[#e8ece5] text-center hover:shadow-xs transition cursor-pointer group hover:border-slate-300 active:scale-[0.98]"
          title="Open Community Threat Network"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#f4f6f2] group-hover:bg-[#dbf65f] text-slate-800 flex items-center justify-center mx-auto mb-2 text-base transition-colors">
            💬
          </div>
          <span className="text-xs font-bold text-slate-900 block font-sans">Community</span>
          <span className="text-[10px] text-slate-400">Threat Network</span>
        </div>

        <div
          onClick={() => setActiveModal('academy')}
          className="bg-white rounded-3xl p-5 border border-[#e8ece5] text-center hover:shadow-xs transition cursor-pointer group hover:border-slate-300 active:scale-[0.98]"
          title="Open SOC Playbooks & Academy"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#f4f6f2] group-hover:bg-[#dbf65f] text-slate-800 flex items-center justify-center mx-auto mb-2 text-base transition-colors">
            🎓
          </div>
          <span className="text-xs font-bold text-slate-900 block font-sans">Academy</span>
          <span className="text-[10px] text-slate-400">SOC Playbooks</span>
        </div>
      </div>

      {/* Vertical Resource List with Diagonal Arrows (from Reference UI) */}
      <div className="space-y-3">
        <div
          onClick={() => setActiveModal('help')}
          className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group cursor-pointer active:scale-[0.99]"
          title="Open Documentation & API Guides"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">?</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Help Center</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Explore our detailed documentation and API guides...</p>
        </div>

        <div
          onClick={() => setActiveModal('partners')}
          className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group cursor-pointer active:scale-[0.99]"
          title="View Verified Community Partners"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">👥</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Partner Directory</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Find verified local businesses and security organizations...</p>
        </div>

        <div
          onClick={() => setActiveModal('blog')}
          className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group cursor-pointer active:scale-[0.99]"
          title="Read Community Threat Advisories"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">📰</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Security Blog</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Access popular community threat advisories and reports...</p>
        </div>

        <div
          onClick={() => setActiveModal('usecases')}
          className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group cursor-pointer active:scale-[0.99]"
          title="Explore Security Use Cases & Rules"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">📊</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Use Cases</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">SIEM ingestion rules, STIX 2.1 bundles, DNS sinkholes...</p>
        </div>
      </div>
    </div>
  );

  // Render Dialog Modals for Right-Sidebar Boxes — rendered via portal at document.body
  // so they are never clipped by any ancestor overflow:hidden/clip container
  const renderModals = () => {
    if (!activeModal) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => setActiveModal(null)}
      >
        <div
          className="bg-white rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-[#e8ece5] p-6 sm:p-8 space-y-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer text-base font-bold"
            title="Close"
          >
            ✕
          </button>

          {/* 1. Community Modal */}
          {activeModal === 'community' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#f4f6f2] text-2xl flex items-center justify-center">💬</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans">Community Threat Network</h3>
                  <p className="text-xs text-slate-500">Collective defense intelligence shared among local community endpoints.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#f8faf7] border border-[#e8ece5]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Peer Nodes</span>
                  <span className="text-xl font-extrabold text-slate-900 font-sans">48 Nodes</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f8faf7] border border-[#e8ece5]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Shared IOCs</span>
                  <span className="text-xl font-extrabold text-indigo-600 font-sans">14,890</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f8faf7] border border-[#e8ece5]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Auto-PII Scrubbed</span>
                  <span className="text-xl font-extrabold text-emerald-600 font-sans">100%</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Connected Defense Sectors</h4>
                <div className="space-y-2 text-xs">
                  {[
                    { sector: '🏥 Healthcare & Community Clinics', nodes: '12 active members', status: 'Synchronized' },
                    { sector: '🏫 Public K-12 & University Networks', nodes: '18 active members', status: 'Synchronized' },
                    { sector: '🏦 Community Credit Unions & Non-Profits', nodes: '11 active members', status: 'Synchronized' },
                    { sector: '⚡ Local Utilities & Municipal Services', nodes: '7 active members', status: 'Synchronized' }
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-200/80">
                      <div>
                        <span className="font-bold text-slate-800">{s.sector}</span>
                        <span className="text-[11px] text-slate-400 block">{s.nodes}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Community federation invite code generated: SHIELD-FED-2026-X891');
                  }}
                  className="px-5 py-2 rounded-full bg-[#111315] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Invite Peer Organization
                </button>
              </div>
            </div>
          )}

          {/* 2. Academy Modal */}
          {activeModal === 'academy' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#f4f6f2] text-2xl flex items-center justify-center">🎓</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans">SOC Academy & Defense Playbooks</h3>
                  <p className="text-xs text-slate-500">Step-by-step incident response procedures for community security operators.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Playbook 01: Phishing Domain & Token Harvester Triage',
                    level: 'Severity: High / Critical',
                    desc: 'Analyze headers, identify credential-harvesting tokens, submit to DNS sinkholes, and notify affected mailboxes.',
                    steps: ['Extract raw URL parameters and sanitize auth tokens', 'Query domain registration age & nameservers', 'Inject drop rule into mail gateway and perimeter firewall']
                  },
                  {
                    title: 'Playbook 02: Ingress SSH & Port Scanning Probe Isolation',
                    level: 'Severity: Critical',
                    desc: 'Triage unsolicited brute-force attempts targeting port 22/8080 and automate iptables drop rules.',
                    steps: ['Verify attacking ASN & IP reputation score', 'Apply fail2ban rate limit or permanent drop rule', 'Broadcast geolocated node telemetry to community map']
                  },
                  {
                    title: 'Playbook 03: Ransomware Lateral Movement Containment',
                    level: 'Severity: Emergency',
                    desc: 'Emergency isolation of SMB/RDP segments upon detection of abnormal cryptographic activity or file churn.',
                    steps: ['Segregate subnet VLAN immediately', 'Revoke active Kerberos and OAuth tokens', 'Restore critical services from immutable offline backups']
                  }
                ].map((pb, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-slate-900">{pb.title}</h4>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">{pb.level}</span>
                    </div>
                    <p className="text-xs text-slate-600">{pb.desc}</p>
                    <div className="bg-[#f8faf7] p-2.5 rounded-xl border border-[#e8ece5] space-y-1 mt-2">
                      {pb.steps.map((st, si) => (
                        <div key={si} className="text-[11px] text-slate-700 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] flex items-center justify-center font-bold">{si + 1}</span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-full bg-[#111315] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* 3. Help Center Modal */}
          {activeModal === 'help' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#f4f6f2] text-2xl flex items-center justify-center">?</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans">Shield AI Help Center & Documentation</h3>
                  <p className="text-xs text-slate-500">API integration guides, endpoint schemas, and automated scoring architecture.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">REST API Endpoints</h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200">
                    <span className="text-emerald-400 font-bold">GET</span> /api/threats <span className="text-slate-400">// Fetch active community threat feed</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200">
                    <span className="text-blue-400 font-bold">POST</span> /api/threats <span className="text-slate-400">// Ingest indicator with neural risk classification</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200">
                    <span className="text-emerald-400 font-bold">GET</span> /api/threats/map/origins <span className="text-slate-400">// Geospatial origin telemetry nodes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200">
                    <span className="text-purple-400 font-bold">GET</span> /api/threats/export?format=stix <span className="text-slate-400">// Export STIX 2.1 JSON bundle</span>
                  </div>
                </div>

                <div className="bg-[#f8faf7] p-4 rounded-2xl border border-[#e8ece5] space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900">How Threat Scoring Works</h5>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Shield AI calculates threat scores (0-100) using a multi-factor risk engine: domain age, ASN reputation, entropy analysis of URL paths, and community sightings. Scores 80+ trigger automated firewall drop recommendations.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-full bg-[#111315] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* 4. Partner Directory Modal */}
          {activeModal === 'partners' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#f4f6f2] text-2xl flex items-center justify-center">👥</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans">Verified Partner Directory</h3>
                  <p className="text-xs text-slate-500">Local organizations and institutions actively participating in community threat sharing.</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'Metro Community Health Alliance', type: 'Healthcare System', loc: 'Frankfurt / Berlin', verified: true, tier: 'Tier 1 Critical' },
                  { name: 'First Civic Credit Union', type: 'Community Banking', loc: 'Amsterdam, NL', verified: true, tier: 'Tier 2 Financial' },
                  { name: 'Valley Regional School District', type: 'Public Education', loc: 'Ashburn, VA', verified: true, tier: 'Community Member' },
                  { name: 'Greater Municipal Water & Energy', type: 'Public Infrastructure', loc: 'Zurich, CH', verified: true, tier: 'Tier 1 Critical' },
                  { name: 'Open Cyber Defense Foundation', type: 'Non-Profit Research', loc: 'Tokyo, JP', verified: true, tier: 'Lead Contributor' }
                ].map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{p.name}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✓ Verified</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{p.type} • {p.loc}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {p.tier}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">Want to list your organization?</span>
                <button
                  onClick={() => {
                    alert('Partner verification application submitted to Shield AI Trust & Safety committee.');
                    setActiveModal(null);
                  }}
                  className="px-5 py-2 rounded-full bg-[#111315] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            </div>
          )}

          {/* 5. Security Blog Modal */}
          {activeModal === 'blog' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#f4f6f2] text-2xl flex items-center justify-center">📰</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans">Community Security Blog & Advisories</h3>
                  <p className="text-xs text-slate-500">In-depth threat analyses, zero-day warnings, and community incident reports.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Advisory SHIELD-2026-08: Quishing & QR Code Payroll Impersonation',
                    date: 'Yesterday • 4 min read',
                    tag: 'PHISHING',
                    desc: 'Attackers are embedding dynamic QR codes inside PDF email attachments to bypass OCR filters and harvest Microsoft 365 credentials.'
                  },
                  {
                    title: 'Advisory SHIELD-2026-07: Automated Port 22/8080 Brute-Force Campaigns',
                    date: '3 days ago • 6 min read',
                    tag: 'PROBING',
                    desc: 'Telemetry reveals a distributed scanner network systematically probing edge gateways across Europe and North America.'
                  },
                  {
                    title: 'Technical Guide: Building Zero-Cost DNS Sinkholes with Pi-hole and STIX 2.1',
                    date: '1 week ago • 8 min read',
                    tag: 'DEFENSE',
                    desc: 'How small community organizations can ingest our automated hosts format directly into local DNS resolvers.'
                  }
                ].map((art, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dbf65f]/20 text-slate-900 font-bold border border-[#dbf65f]/40">
                        {art.tag}
                      </span>
                      <span className="text-[10px] text-slate-400">{art.date}</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">{art.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{art.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-full bg-[#111315] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* 6. Use Cases Modal */}
          {activeModal === 'usecases' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#f4f6f2] text-2xl flex items-center justify-center">📊</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans">Security Use Cases & SIEM Integration</h3>
                  <p className="text-xs text-slate-500">How to operationalize Shield AI threat intelligence in your network defense stack.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Use Case 1: Automated Perimeter Drop via iptables & pfSense',
                    desc: 'Export malicious IP rules to immediately drop brute-force scanners before they reach SSH or API endpoints.',
                    format: 'Linux iptables & CIDR blocklists'
                  },
                  {
                    title: 'Use Case 2: DNS Sinkholing with Unbound / AdGuard / Pi-hole',
                    desc: 'Redirect malicious phishing domains and C2 servers to 0.0.0.0, rendering credential-harvesting links harmless.',
                    format: 'Standard /etc/hosts & unbound.conf'
                  },
                  {
                    title: 'Use Case 3: Enterprise SIEM & SOC Pipeline Ingestion',
                    desc: 'Feed standardized STIX 2.1 JSON bundles and Suricata IDS rules into Splunk, Elastic, or Microsoft Sentinel.',
                    format: 'OASIS STIX 2.1 & Suricata .rules'
                  }
                ].map((uc, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-900">{uc.title}</h4>
                    <p className="text-xs text-slate-600">{uc.desc}</p>
                    <span className="inline-block text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 mt-1">
                      Format: {uc.format}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveTab('SIEM Rules');
                    setActiveModal(null);
                  }}
                  className="px-5 py-2 rounded-full bg-[#111315] hover:bg-black text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>Open SIEM Rules Exporter</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>,
      document.body
    );
  };

  // Render view depending on the selected active pill tab!
  const renderTabContent = (isSysAdmin = false) => {
    switch (activeTab) {
      case 'Threat Feed':
        return (
          <div className="space-y-6">
            <IncidentStreamTable
              extraThreats={threats}
              onUpdateStatus={onUpdateStatus}
              onRemoveThreat={onRemoveThreat}
              userRole={userRole}
              refreshThreats={refreshThreats}
            />
          </div>
        );

      case 'Analytics':
        return (
          <div className="space-y-6">
            <MetricCards />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7">
                <ThreatTimelineChart />
              </div>
              <div className="md:col-span-5">
                <RiskDistributionChart />
              </div>
            </div>
            <AnalyticsView threats={threats} onRefresh={refreshThreats} />
          </div>
        );

      case 'Geospatial Map':
        return (
          <div className="space-y-6">
            <InteractiveThreatMap />
          </div>
        );

      case 'Email Digest':
        return (
          <div className="space-y-6">
            <WeeklyEmailDigestPanel userRole={userRole} />
          </div>
        );

      case 'SIEM Rules':
        return (
          <div className="space-y-6">
            <SiemRulesView threats={threats} />
          </div>
        );

      case 'Organization':
      default:
        // Default Overview Dashboard
        return (
          <div className="space-y-7">
            {/* Main Grid: Left Main (8 cols) + Right Cards (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                {/* Top Metric Cards */}
                <MetricCards />

                {isSysAdmin ? (
                  /* SysAdmin Charts */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    <div className="md:col-span-7">
                      <ThreatTimelineChart />
                    </div>
                    <div className="md:col-span-5">
                      <RiskDistributionChart />
                    </div>
                  </div>
                ) : (
                  /* Standard User Advisory & Quick Scanner */
                  <>
                    <div className="bg-white rounded-3xl p-6 border border-[#e8ece5] space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📢</span>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                          Active Community Advisory: Urgent Phishing Warning
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        Multiple credential-harvesting domains pretending to be banking services have been reported. 
                        Always inspect indicator parameters before submitting, and click <strong>"I saw this too"</strong> on verified incidents to accelerate triage for other members.
                      </p>
                    </div>

                    <div id="indicator-scanner-section" className="bg-white rounded-3xl p-6 border border-[#e8ece5] space-y-4 shadow-2xs">
                      <div className="border-b border-[#e8ece5] pb-3 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 font-sans">Quick Indicator Scan & Report</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Submit suspicious links or IPs directly to the community feed.</p>
                        </div>
                        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#dbf65f]/20 text-[#111315] font-bold border border-[#dbf65f]/40">
                          AUTO-PII SANITIZED
                        </span>
                      </div>
                      <InspectionPanel onThreatAdded={() => { if (refreshThreats) refreshThreats(); }} />
                    </div>
                  </>
                )}
              </div>

              {/* Right Reference Cards (Now fully interactive) */}
              <div className="lg:col-span-4">
                {renderRightSidebarCards()}
              </div>
            </div>

            {/* Interactive Threat Origin Map */}
            <InteractiveThreatMap />

            {/* Incident Stream Table with Full Triage Powers */}
            <IncidentStreamTable 
              extraThreats={threats} 
              onUpdateStatus={onUpdateStatus} 
              onRemoveThreat={onRemoveThreat} 
              userRole={userRole}
              refreshThreats={refreshThreats}
            />

            {/* Weekly Email Digest & Celery Worker Queue */}
            <WeeklyEmailDigestPanel userRole={userRole} />
          </div>
        );
    }
  };

  const isSysAdmin = userRole === 'sys_admin';

  return (
    <div className="space-y-7">
      {renderHeader(isSysAdmin)}
      {renderTabContent(isSysAdmin)}
      {renderModals()}
    </div>
  );
}
