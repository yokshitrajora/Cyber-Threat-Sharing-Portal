import { NavLink } from 'react-router-dom';
import { SYSTEM_HEALTH } from '../data/mockThreats';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Vertical Sidebar Console Panel */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white/75 backdrop-blur-2xl border-r border-white/80 shadow-[10px_0_30px_-15px_rgba(15,23,42,0.05)] z-50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Top Header & Brand */}
        <div className="p-6 border-b border-slate-200/60">
          <NavLink to="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-slate-900/15 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1 font-sans">
                Shield<span className="text-indigo-600 font-serif italic font-normal">AI</span>
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase -mt-0.5">
                Threat Detection
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto font-sans">
          
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-2.5 font-bold">
              Monitoring & SOC
            </span>
            <nav className="space-y-1.5">
              <NavLink
                to="/"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
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
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Live Threat Feed</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200/70">
                  LIVE
                </span>
              </NavLink>

              <NavLink
                to="/analytics"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
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
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Indicator Scanner</span>
                </div>
              </NavLink>
            </nav>
          </div>

          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-2.5 font-bold">
              Telemetry Engine
            </span>
            <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">CPU Cluster Load</span>
                <span className="font-mono text-slate-800 font-bold">{SYSTEM_HEALTH.cpuUsage}%</span>
              </div>
              <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${SYSTEM_HEALTH.cpuUsage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-600 font-medium">RAM Memory</span>
                <span className="font-mono text-slate-800 font-bold">{SYSTEM_HEALTH.memoryUsage}%</span>
              </div>
              <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-800 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${SYSTEM_HEALTH.memoryUsage}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Operator Profile Card */}
        <div className="p-4 border-t border-slate-200/60 bg-white/40">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-white shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              OP
            </div>
            <div className="flex-1 truncate">
              <span className="block text-xs font-bold text-slate-800 truncate">SOC Lead Operator</span>
              <span className="block text-[11px] font-sans text-slate-400 font-medium truncate">
                Security Operations
              </span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
