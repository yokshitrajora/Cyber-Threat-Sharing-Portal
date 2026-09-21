import { NavLink } from 'react-router-dom';
import { SYSTEM_HEALTH } from '../data/mockThreats';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Vertical Sidebar Console Panel */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-neutral-950/85 backdrop-blur-2xl border-r border-white/12 z-50 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Top Header & Brand */}
        <div className="p-5 border-b border-white/10">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-white/20 to-white/5 border border-white/30 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 font-sans">
                Shield<span className="text-slate-300 font-serif italic font-normal">AI</span>
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase -mt-0.5">
                Threat Detection
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto font-sans">
          
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 px-3 mb-3 font-bold">
              Monitoring & SOC
            </span>
            <nav className="space-y-2">
              <NavLink
                to="/"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'btn-3d-primary'
                      : 'btn-3d-secondary opacity-80 hover:opacity-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Overview Dashboard</span>
                </div>
              </NavLink>

              <NavLink
                to="/feed"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'btn-3d-primary'
                      : 'btn-3d-secondary opacity-80 hover:opacity-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Live Threat Feed</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-400/30">
                  LIVE
                </span>
              </NavLink>

              <NavLink
                to="/analytics"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'btn-3d-primary'
                      : 'btn-3d-secondary opacity-80 hover:opacity-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Threat Analytics</span>
                </div>
              </NavLink>

              <NavLink
                to="/report"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'btn-3d-primary'
                      : 'btn-3d-secondary opacity-80 hover:opacity-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Indicator Scanner</span>
                </div>
              </NavLink>
            </nav>
          </div>

          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 px-3 mb-2 font-bold">
              Telemetry Engine
            </span>
            <div className="space-y-1 text-xs">
              <div className="px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 space-y-2 backdrop-blur-md">
                <div className="flex justify-between items-center text-[11px]">
                  <span>CPU Cluster Load</span>
                  <span className="font-mono text-white font-bold">{SYSTEM_HEALTH.cpuUsage}%</span>
                </div>
                <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-gradient-to-r from-slate-200 to-white h-full rounded-full shadow-sm" style={{ width: `${SYSTEM_HEALTH.cpuUsage}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span>RAM Memory</span>
                  <span className="font-mono text-slate-300 font-bold">{SYSTEM_HEALTH.memoryUsage}%</span>
                </div>
                <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-gradient-to-r from-slate-400 to-slate-200 h-full rounded-full shadow-sm" style={{ width: `${SYSTEM_HEALTH.memoryUsage}%` }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Operator Profile Card */}
        <div className="p-3 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/12 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center font-bold text-xs border border-white/30 shadow-xs">
              OP
            </div>
            <div className="flex-1 truncate">
              <span className="block text-xs font-bold text-white truncate">SOC Lead Operator</span>
              <span className="block text-[10px] font-sans text-slate-400 font-semibold truncate">
                Security Operations
              </span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
