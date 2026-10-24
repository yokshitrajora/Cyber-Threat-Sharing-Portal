import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const initialQuery = searchParams.get('search') || '';
  const [query, setQuery] = useState(initialQuery);

  // Sync state if URL search query changes externally
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
    <header className="bg-white/60 backdrop-blur-xl border-b border-white/80 sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.03)]">
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button, Circular Back Button & Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden btn-synthex-icon text-slate-600"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Synthex Circular Back Action Button (as seen in Synthex UI) */}
          <button 
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex btn-synthex-icon text-slate-500 hover:text-slate-800"
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
              className="w-full pl-10 pr-9 py-2 input-synthex rounded-full text-xs text-slate-800 placeholder-slate-400 font-sans"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition"
                title="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to="/report"
            className="btn-synthex-primary px-4 py-2 text-xs rounded-full shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Scan Indicator</span>
          </NavLink>
        </div>

      </div>
    </header>
  );
}
