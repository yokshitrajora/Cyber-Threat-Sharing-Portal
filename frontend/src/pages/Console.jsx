import { useState } from 'react';
import MetricCards from '../components/MetricCards';
import ThreatTimelineChart from '../components/ThreatTimelineChart';
import RiskDistributionChart from '../components/RiskDistributionChart';
import IncidentStreamTable from '../components/IncidentStreamTable';
import InspectionPanel from '../components/InspectionPanel';
import InteractiveThreatMap from '../components/InteractiveThreatMap';
import WeeklyEmailDigestPanel from '../components/WeeklyEmailDigestPanel';
import OrgDashboard from './OrgDashboard';
import AdminPanel from './AdminPanel';

export default function Console({ threats, onUpdateStatus, onRemoveThreat, isLiveConnected, userRole, refreshThreats }) {
  const [activeTab, setActiveTab] = useState('Organization');

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
              const el = document.getElementById('indicator-scanner-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
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

  // Common Right-Side Action & Resource Cards (from Reference UI)
  const renderRightSidebarCards = () => (
    <div className="space-y-4">
      {/* Top 2 Action Cards (Community & Academy from Reference UI) */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece5] text-center hover:shadow-xs transition cursor-pointer group">
          <div className="w-10 h-10 rounded-2xl bg-[#f4f6f2] group-hover:bg-[#dbf65f] text-slate-800 flex items-center justify-center mx-auto mb-2 text-base transition-colors">
            💬
          </div>
          <span className="text-xs font-bold text-slate-900 block font-sans">Community</span>
          <span className="text-[10px] text-slate-400">Threat Network</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e8ece5] text-center hover:shadow-xs transition cursor-pointer group">
          <div className="w-10 h-10 rounded-2xl bg-[#f4f6f2] group-hover:bg-[#dbf65f] text-slate-800 flex items-center justify-center mx-auto mb-2 text-base transition-colors">
            🎓
          </div>
          <span className="text-xs font-bold text-slate-900 block font-sans">Academy</span>
          <span className="text-[10px] text-slate-400">SOC Playbooks</span>
        </div>
      </div>

      {/* Vertical Resource List with Diagonal Arrows (from Reference UI) */}
      <div className="space-y-3">
        <div className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group">
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">?</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Help Center</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Explore our detailed documentation and API guides...</p>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group">
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">👥</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Partner Directory</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Find verified local businesses and security organizations...</p>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group">
          <div className="flex justify-between items-start mb-1">
            <span className="w-7 h-7 rounded-xl bg-[#f4f6f2] text-slate-700 flex items-center justify-center text-xs font-bold">📰</span>
            <span className="text-slate-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm">↗</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 font-sans mt-2">Security Blog</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Access popular community threat advisories and reports...</p>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-[#e8ece5] hover:border-slate-300 transition shadow-2xs group">
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

  // If System Admin, show full SOC Command Center with the reference UI styling
  if (userRole === 'sys_admin') {
    return (
      <div className="space-y-7">
        {renderHeader(true)}

        {/* Main Grid: Left Main (8 cols) + Right Cards (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Top Metric Cards */}
            <MetricCards />

            {/* Timeline & Risk Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7">
                <ThreatTimelineChart />
              </div>
              <div className="md:col-span-5">
                <RiskDistributionChart />
              </div>
            </div>
          </div>

          {/* Right Reference Cards */}
          <div className="lg:col-span-4">
            {renderRightSidebarCards()}
          </div>
        </div>

        {/* Interactive Threat Origin Map */}
        <InteractiveThreatMap />

        {/* Incident Stream Table with Full Admin Triage Powers */}
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

  // ─── Standard User Dashboard ────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      {renderHeader(false)}

      {/* Main Grid: Left Main (8 cols) + Right Cards (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Top Metric Cards */}
          <MetricCards />

          {/* Community Phishing Advisory Banner */}
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

          {/* Quick Indicator Ingestion Form */}
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
            <InspectionPanel onThreatAdded={(t) => { if (refreshThreats) refreshThreats(); }} />
          </div>
        </div>

        {/* Right Reference Cards */}
        <div className="lg:col-span-4">
          {renderRightSidebarCards()}
        </div>
      </div>

      {/* Incident Stream Table with Community Actions */}
      <IncidentStreamTable 
        extraThreats={threats} 
        onUpdateStatus={onUpdateStatus} 
        onRemoveThreat={onRemoveThreat} 
        userRole={userRole}
        refreshThreats={refreshThreats}
      />

      {/* Interactive Global Threat Origin Map */}
      <InteractiveThreatMap />

      {/* Weekly Community Threat Digest Panel */}
      <WeeklyEmailDigestPanel userRole={userRole} />

    </div>
  );
}
