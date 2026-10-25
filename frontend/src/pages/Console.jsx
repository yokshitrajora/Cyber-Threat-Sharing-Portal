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

  // If Org Admin, render the specialized Enterprise Org Dashboard on overview
  if (userRole === 'org_admin') {
    return <OrgDashboard threats={threats} userRole={userRole} />;
  }

  // If System Admin, show full SOC Command Center with tab toggle to Admin Panel
  if (userRole === 'sys_admin') {
    return (
      <div className="space-y-7">
        {/* SOC Root Admin Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs">
                ⚡ AUTONOMOUS SOC COMMAND (TIER 3)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                FULL RBAC PRIVILEGES
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
              SOC Security <span className="font-serif italic font-normal text-rose-600">Command Center</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans">
            <span className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 flex items-center gap-2 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              {isLiveConnected ? 'Shield AI Neural Engine Live' : 'Edge Sensor Cache'}
            </span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <MetricCards />

        {/* Timeline & Risk Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <ThreatTimelineChart />
          </div>
          <div className="lg:col-span-4">
            <RiskDistributionChart />
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
  const sightingsTotal = (threats || []).reduce((acc, t) => acc + (t.sightingsCount || t.sightings_count || 0), 0);
  const userReportCount = (threats || []).length;

  return (
    <div className="space-y-7">
      
      {/* Standard User Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 mb-1">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs">
              👤 COMMUNITY DEFENSE PORTAL (TIER 1)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              COMMUNITY CONTRIBUTOR
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
            Community Threat <span className="font-serif italic font-normal text-indigo-600">Sharing Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
            Report malicious URLs, verify community sightings, and stay protected with crowd-sourced cybersecurity intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            {isLiveConnected ? 'Community Sync Online' : 'Local Offline Mode'}
          </span>
        </div>
      </div>

      {/* Community-Specific Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Community Reports</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">🛡️</span>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 font-sans block">{userReportCount}</span>
          <span className="text-[11px] text-slate-400">Total indicators in feed</span>
        </div>

        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Sightings Verified</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">👁</span>
          </div>
          <span className="text-3xl font-extrabold text-indigo-600 font-sans block">{sightingsTotal}</span>
          <span className="text-[11px] text-slate-400">Community confirmations</span>
        </div>

        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Shield Protection</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">✓</span>
          </div>
          <span className="text-3xl font-extrabold text-emerald-600 font-sans block">ACTIVE</span>
          <span className="text-[11px] text-slate-400">Autonomous edge scanning</span>
        </div>

        <div className="card-glass rounded-[26px] p-5 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Trust Rating</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">⭐</span>
          </div>
          <span className="text-3xl font-extrabold text-purple-600 font-sans block">98.4%</span>
          <span className="text-[11px] text-slate-400">Crowd accuracy score</span>
        </div>
      </div>

      {/* Community Education & Phishing Alerts Banner */}
      <div className="card-glass rounded-[28px] p-6 border border-white space-y-3 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📢</span>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
            Active Community Advisory: Urgent Phishing Warning
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          Multiple suspicious credential-harvesting domains pretending to be banking and crypto login services have been reported. 
          Always inspect indicator parameters before submitting, and click <strong>"I saw this too"</strong> on verified incidents to accelerate triage for other members.
        </p>
      </div>

      {/* Quick Indicator Ingestion Form right on standard user dashboard */}
      <div className="card-glass rounded-[28px] p-6 sm:p-7 space-y-4">
        <div className="border-b border-slate-200/60 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-sans">Quick Indicator Scan & Report</h3>
            <p className="text-xs text-slate-500 mt-0.5">Submit suspicious links or IPs directly to the community feed.</p>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
            AUTO-PII SANITIZED
          </span>
        </div>
        <InspectionPanel onThreatAdded={(t) => { if (refreshThreats) refreshThreats(); }} />
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
