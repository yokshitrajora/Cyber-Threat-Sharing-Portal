import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Topbar({ onToggleSidebar, userRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, quickLogin } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  
  const initialQuery = searchParams.get('search') || '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    const trimmed = val.trim();
    if (trimmed) {
      const targetPath = location.pathname === '/feed' || location.pathname === '/' ? location.pathname : '/feed';
      navigate(`${targetPath}?search=${encodeURIComponent(trimmed)}`, { replace: true });
    } else {
      if (searchParams.has('search')) {
        navigate(location.pathname, { replace: true });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmed = query.trim();
      if (trimmed) {
        navigate(`/feed?search=${encodeURIComponent(trimmed)}`);
      } else {
        navigate('/feed');
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    if (searchParams.has('search')) {
      navigate(location.pathname, { replace: true });
    }
  };

  return (
    <header className="bg-[#f8faf7] border-b border-[#e8ece5] sticky top-0 z-30">
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button, Back Button & Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden btn-synthex-icon text-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button 
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex btn-synthex-icon text-slate-600 hover:text-black"
            title="Go back"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search threat indicators, IP addresses, domains, or CVE IDs..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#e8ece5] rounded-full text-xs text-slate-800 placeholder-slate-400 font-sans shadow-2xs focus:border-[#111315] focus:outline-none"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Role Badge + Action Button */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Interactive Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border border-[#e8ece5] bg-white text-slate-800 transition cursor-pointer hover:bg-[#f2f5ef] shadow-2xs"
              title="Click to switch RBAC Role tier"
            >
              <span className={`w-2 h-2 rounded-full ${userRole === 'sys_admin' ? 'bg-rose-500' : userRole === 'org_admin' ? 'bg-purple-500' : 'bg-[#dbf65f]'}`}></span>
              <span>{userRole === 'sys_admin' ? '⚡ System Admin' : userRole === 'org_admin' ? '🏢 Org Admin' : '👤 Standard User'}</span>
              <span className="text-[9px] text-slate-400">⌄</span>
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-3xl p-2 border border-[#e8ece5] shadow-xl z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Switch RBAC Tier
                </div>
                {[
                  { id: 'standard', name: 'Standard User', icon: '👤', cls: 'text-slate-700 hover:bg-[#f4f6f1]' },
                  { id: 'org_admin', name: 'Org Admin', icon: '🏢', cls: 'text-purple-700 hover:bg-purple-50' },
                  { id: 'sys_admin', name: 'System Admin', icon: '⚡', cls: 'text-rose-700 hover:bg-rose-50' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={async () => {
                      setRoleMenuOpen(false);
                      try { await quickLogin(r.id); } catch (e) { console.error(e); }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-2xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      userRole === r.id ? 'bg-[#111315] text-[#dbf65f] font-bold' : r.cls
                    }`}
                  >
                    <span>{r.icon} {r.name}</span>
                    {userRole === r.id && <span className="text-[10px] text-[#dbf65f]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Button (charcoal pill with + like in Reference UI) */}
          <NavLink
            to="/report"
            className="bg-[#111315] hover:bg-black text-white px-5 py-2.5 text-xs font-bold rounded-full shrink-0 shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <span className="text-[#dbf65f] font-mono font-bold text-sm leading-none">+</span>
            <span>Scan Indicator</span>
          </NavLink>
        </div>

      </div>
    </header>
  );
}
