import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { SYSTEM_HEALTH } from '../data/mockThreats';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABELS = {
  standard: { name: 'Standard User', sub: 'Community Access', color: 'from-blue-600 to-blue-400' },
  org_admin: { name: 'Org Admin', sub: 'Verified Partner', color: 'from-purple-600 to-purple-400' },
  sys_admin: { name: 'System Admin', sub: 'Full Access', color: 'from-rose-600 to-rose-400' }
};

export default function Sidebar({ isOpen, onClose, userRole }) {
  const { logout, user } = useAuth();
  const roleInfo = ROLE_LABELS[userRole] || ROLE_LABELS.standard;
  const asideRef = useRef(null);
  const wrapperRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const updateStickyPosition = () => {
      if (!cardRef.current || !asideRef.current || !wrapperRef.current) return;

      // On mobile screens, keep standard flow inside the offcanvas drawer
      if (window.innerWidth < 1024) {
        cardRef.current.style.transform = 'none';
        return;
      }

      const asideEl = asideRef.current;
      const cardEl = cardRef.current;
      const wrapperEl = wrapperRef.current;

      const asideRect = asideEl.getBoundingClientRect();
      const asideHeight = asideEl.offsetHeight;
      const cardHeight = cardEl.offsetHeight;

      // Natural starting top of the card wrapper right below Telemetry Engine
      const minTop = wrapperEl.offsetTop;

      // Upper bound so the card never overflows past the bottom of the sidebar
      const maxTop = Math.max(minTop, asideHeight - cardHeight - 20);

      // Distance from top of aside to bottom of current viewport
      const viewportBottomInAside = window.innerHeight - asideRect.top;

      // Desired top position: keep card pinned 20px above the bottom of the viewport
      const targetTop = viewportBottomInAside - cardHeight - 20;

      // Clamp between minTop (never overlaps nav/telemetry) and maxTop (never leaves container)
      const finalTop = Math.min(Math.max(minTop, targetTop), maxTop);

      // Calculate hardware-accelerated transform offset from natural starting point
      const offset = Math.max(0, finalTop - minTop);

      cardEl.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const handleScrollOrResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateStickyPosition);
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    // Initial check on mount / route update
    updateStickyPosition();

    // Observe document and container expansions
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && asideRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleScrollOrResize();
      });
      resizeObserver.observe(asideRef.current);
      if (document.body) {
        resizeObserver.observe(document.body);
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isOpen]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-[#202327] text-[#dbf65f] shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-[#191c20]'
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Vertical Sidebar Console Panel (Charcoal Pillar from Reference UI) */}
      <aside
        ref={asideRef}
        className={`fixed lg:absolute top-0 left-0 bottom-0 w-64 bg-[#111315] text-slate-300 z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } overflow-y-auto lg:overflow-visible`}
      >
        
        {/* Top Header & Brand with + Button */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#202327] border border-white/10 text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform duration-200">
              <span className="text-[#dbf65f] font-mono text-xl leading-none">+</span>
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1 font-sans">
                Shield<span className="text-[#dbf65f] font-serif italic font-normal">AI</span>
              </span>
              <span className="block text-[9px] font-mono tracking-widest text-slate-400 font-semibold uppercase -mt-0.5">
                SOC Intelligence
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Section */}
        <div className="px-3.5 py-4 space-y-5 font-sans shrink-0">
          
          {/* ─── Core Navigation (All Roles) ─── */}
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 mb-2 font-bold">
              Monitoring & Workflows
            </span>
            <nav className="space-y-1">
              <NavLink to="/" end onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Overview Dashboard</span>
                </div>
              </NavLink>

              <NavLink to="/feed" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Live Threat Feed</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dbf65f]/15 text-[#dbf65f] font-bold border border-[#dbf65f]/30">
                  LIVE
                </span>
              </NavLink>

              <NavLink to="/analytics" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Threat Analytics</span>
                </div>
              </NavLink>

              <NavLink to="/map" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Threat Origin Map</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold border border-white/15">
                  MAP
                </span>
              </NavLink>

              <NavLink to="/report" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Indicator Scanner</span>
                </div>
              </NavLink>
            </nav>
          </div>

          {/* ─── Org Admin Section ─── */}
          {(userRole === 'org_admin' || userRole === 'sys_admin') && (
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 mb-2 font-bold">
                Organization
              </span>
              <nav className="space-y-1">
                <NavLink to="/org" onClick={onClose} className={navLinkClass}>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Org Dashboard</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    ORG
                  </span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* ─── Sys Admin Section ─── */}
          {userRole === 'sys_admin' && (
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 mb-2 font-bold">
                Administration
              </span>
              <nav className="space-y-1">
                <NavLink to="/admin" onClick={onClose} className={navLinkClass}>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Admin Panel</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    ADMIN
                  </span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Telemetry Engine */}
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 mb-2 font-bold">
              Telemetry Engine
            </span>
            <div className="p-3.5 rounded-2xl bg-[#191c20] border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">CPU Cluster Load</span>
                <span className="font-mono text-white font-bold">{SYSTEM_HEALTH.cpuUsage}%</span>
              </div>
              <div className="w-full bg-[#23272d] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#dbf65f] h-full rounded-full transition-all duration-500"
                  style={{ width: `${SYSTEM_HEALTH.cpuUsage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400 font-medium">RAM Memory</span>
                <span className="font-mono text-white font-bold">{SYSTEM_HEALTH.memoryUsage}%</span>
              </div>
              <div className="w-full bg-[#23272d] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${SYSTEM_HEALTH.memoryUsage}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Operator Profile Card - Sticky moving down as user scrolls */}
        <div className="sticky bottom-4 mx-3.5 z-30 mt-auto pt-3 pb-1">
          <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-[#191c20] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <span className="block text-xs font-bold text-white truncate">
                  {user?.username || roleInfo.name}
                </span>
                <span className="block text-[10px] font-sans text-slate-400 truncate">
                  {roleInfo.sub}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className={`flex-1 text-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                userRole === 'sys_admin' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                userRole === 'org_admin' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
                'bg-[#dbf65f]/10 text-[#dbf65f] border-[#dbf65f]/30'
              }`}>
                {userRole}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-bold py-1 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
