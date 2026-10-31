import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ParticleWaveBackground from './components/ParticleWaveBackground';
import Landing from './pages/Landing';
import Console from './pages/Console';
import ReportForm from './pages/ReportForm';
import LiveFeed from './pages/LiveFeed';
import ThreatMapPage from './pages/ThreatMapPage';
import AdminPanel from './pages/AdminPanel';
import OrgDashboard from './pages/OrgDashboard';
import { useThreats } from './hooks/useThreats';

function ProtectedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, role, loading } = useAuth();
  const { threats, addThreat, updateStatus, removeThreat, isLiveConnected, refreshThreats } = useThreats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent relative">
        <ParticleWaveBackground />
        <div className="card-glass rounded-[28px] p-8 text-center z-20">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-sans text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-transparent text-slate-800 font-sans relative overflow-x-hidden w-full min-h-screen">
        <ParticleWaveBackground />
        <Landing />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#9ea89e] text-[#111315] font-sans p-2 sm:p-5 flex items-center justify-center">
        {/* Main Rounded App Container matching Reference UI */}
        <div className="w-full max-w-[1580px] bg-[#f8faf7] rounded-[32px] sm:rounded-[44px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.22)] border border-white/50 overflow-clip flex min-h-[calc(100vh-2.5rem)] relative">
          
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userRole={role}
          />

          <div className="flex-1 flex flex-col lg:pl-64 min-w-0 relative z-10 transition-all duration-300">
            <Topbar
              onToggleSidebar={() => setSidebarOpen(prev => !prev)}
              userRole={role}
            />

            <main className="flex-1 px-4 sm:px-8 py-7 max-w-7xl w-full mx-auto space-y-7">
              <Routes>
                <Route
                  path="/"
                  element={<Console threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} isLiveConnected={isLiveConnected} userRole={role} refreshThreats={refreshThreats} />}
                />
                <Route
                  path="/report"
                  element={<ReportForm addThreat={addThreat} />}
                />
                <Route
                  path="/feed"
                  element={<LiveFeed threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} isLiveConnected={isLiveConnected} userRole={role} refreshThreats={refreshThreats} />}
                />
                <Route
                  path="/analytics"
                  element={<Navigate to="/" replace />}
                />
                <Route
                  path="/map"
                  element={<ThreatMapPage />}
                />
                {/* Org Admin Dashboard */}
                {(role === 'org_admin' || role === 'sys_admin') && (
                  <Route
                    path="/org"
                    element={<OrgDashboard threats={threats} userRole={role} />}
                  />
                )}
                {/* System Admin Panel */}
                {role === 'sys_admin' && (
                  <Route
                    path="/admin"
                    element={<AdminPanel threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} refreshThreats={refreshThreats} />}
                  />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <footer className="border-t border-[#e8ece5] bg-[#f8faf7] py-4 text-xs font-sans text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
                <p className="font-medium text-slate-600">© {new Date().getFullYear()} Shield AI Threat Detection System.</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-[#dbf65f] shadow-[0_0_8px_#dbf65f]' : 'bg-amber-400'}`}></span>
                    <span className="font-semibold text-slate-700">{isLiveConnected ? 'All Systems Operational' : 'Offline Mode'}</span>
                  </span>
                  <span>threats.shieldcommunity.io</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App;
