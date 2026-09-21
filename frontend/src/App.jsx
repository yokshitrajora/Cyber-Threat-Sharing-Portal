import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Console from './pages/Console';
import ReportForm from './pages/ReportForm';
import LiveFeed from './pages/LiveFeed';
import Analytics from './pages/Analytics';
import ParticleWaveBackground from './components/ParticleWaveBackground';
import { useThreats } from './hooks/useThreats';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { threats, addThreat, updateStatus, removeThreat, isLiveConnected } = useThreats();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-transparent text-slate-100 font-sans flex relative overflow-x-hidden">
        {/* Animated 3D Particle & Volumetric Infinity Wave Canvas Background */}
        <ParticleWaveBackground />

        {/* Left Vertical Navigation Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content Area (Offset for Desktop Sidebar) */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0 relative z-10">
          
          {/* Topbar Header */}
          <Topbar 
            onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          />

          {/* Page Routing Views */}
          <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto space-y-6">
            <Routes>
              <Route 
                path="/" 
                element={<Console threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} isLiveConnected={isLiveConnected} />} 
              />
              <Route 
                path="/report" 
                element={<ReportForm addThreat={addThreat} />} 
              />
              <Route 
                path="/feed" 
                element={<LiveFeed threats={threats} onUpdateStatus={updateStatus} onRemoveThreat={removeThreat} isLiveConnected={isLiveConnected} />} 
              />
              <Route 
                path="/analytics" 
                element={<Analytics />} 
              />
            </Routes>
          </main>

          {/* Footer Bar - Clean, minimal footer */}
          <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-4 text-xs font-sans text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
              <p>© {new Date().getFullYear()} Shield AI Threat Detection System.</p>
            </div>
          </footer>

        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
