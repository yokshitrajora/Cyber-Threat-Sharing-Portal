import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Console from './pages/Console';
import ReportForm from './pages/ReportForm';
import LiveFeed from './pages/LiveFeed';
import Analytics from './pages/Analytics';
import ParticleWaveBackground from './components/ParticleWaveBackground';
import Landing from './pages/Landing';
import { useThreats } from './hooks/useThreats';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { threats, addThreat, updateStatus, removeThreat, isLiveConnected } = useThreats();

  if (!userRole) {
    return (
      <div className="bg-transparent text-slate-100 font-sans relative overflow-x-hidden w-full min-h-screen">
        <ParticleWaveBackground />
        <Landing onLogin={setUserRole} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-transparent text-slate-800 font-sans flex relative overflow-x-hidden">
        {/* Animated Synthex Luminous Ambient Frosted Canvas */}
        <ParticleWaveBackground />

        {/* Left Floating Frosted Navigation Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          userRole={userRole}
          setUserRole={setUserRole}
        />

        {/* Main Content Area (Offset for Desktop Sidebar) */}
        <div className="flex-1 flex flex-col lg:pl-72 min-w-0 relative z-10 transition-all duration-300">
          
          {/* Topbar Header */}
          <Topbar 
            onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          />

          {/* Page Routing Views */}
          <main className="flex-1 px-4 sm:px-8 py-7 max-w-7xl w-full mx-auto space-y-7">
            <Routes>
              <Route 
                path="/" 
                element={<Console threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} isLiveConnected={isLiveConnected} userRole={userRole} />} 
              />
              <Route 
                path="/report" 
                element={<ReportForm addThreat={addThreat} />} 
              />
              <Route 
                path="/feed" 
                element={<LiveFeed threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} isLiveConnected={isLiveConnected} userRole={userRole} />} 
              />
              <Route 
                path="/analytics" 
                element={<Analytics />} 
              />
            </Routes>
          </main>

          {/* Footer Bar - Clean, minimal frosted footer */}
          <footer className="border-t border-white/60 bg-white/40 backdrop-blur-md py-4 text-xs font-sans text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="font-medium">© {new Date().getFullYear()} Shield AI Threat Detection System.</p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  All Systems Operational
                </span>
                <span>threats.shieldcommunity.io</span>
              </div>
            </div>
          </footer>

        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
