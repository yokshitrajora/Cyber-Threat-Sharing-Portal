import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const ROLE_CONFIG = [
  {
    id: 'standard',
    name: 'Standard User',
    description: 'Submit threat reports, view public feeds, and confirm community sightings.',
    icon: '👤',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: 'hover:border-blue-400',
    borderActive: 'border-blue-500 ring-2 ring-blue-200',
    defaultCredentials: { username: 'user', password: 'ShieldUser2026!' }
  },
  {
    id: 'org_admin',
    name: 'Verified Organization Admin',
    description: 'Export verified threat indicators to CSV/STIX and receive emergency alerts.',
    icon: '🏢',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    accentColor: 'hover:border-purple-400',
    borderActive: 'border-purple-500 ring-2 ring-purple-200',
    defaultCredentials: { username: 'orgadmin', password: 'ShieldOrg2026!' }
  },
  {
    id: 'sys_admin',
    name: 'System Analyst / Admin',
    description: 'Override false positives, review flagged reports, and manage telemetry.',
    icon: '⚡',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: 'hover:border-rose-400',
    borderActive: 'border-rose-500 ring-2 ring-rose-200',
    defaultCredentials: { username: 'admin', password: 'ShieldAdmin2026!' }
  }
];

export default function Landing() {
  const { login, quickLogin, register, error, setError } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' | 'login' | 'register'
  const [formData, setFormData] = useState({ username: '', email: '', password: '', organization: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleQuickLogin = async (role) => {
    setSubmitting(true);
    setError(null);
    try {
      await quickLogin(role.id);
    } catch {
      // Fallback: Show login form instead on failure
      setSelectedRole(role);
      setMode('login');
      setFormData(prev => ({ ...prev, username: role.defaultCredentials.username, password: role.defaultCredentials.password }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(formData.username, formData.password);
    } catch { /* error set via context */ }
    finally { setSubmitting(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: selectedRole?.id || 'standard',
        organization: formData.organization
      });
    } catch { /* error set via context */ }
    finally { setSubmitting(false); }
  };

  const goBack = () => {
    setMode('select');
    setSelectedRole(null);
    setError(null);
    setSuccessMsg('');
    setFormData({ username: '', email: '', password: '', organization: '' });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-20 p-6">
      <div className="max-w-4xl w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 text-white shadow-xl shadow-slate-900/15 mb-6 group hover:scale-105 transition-transform duration-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-sans">
            Shield<span className="font-serif italic font-normal text-indigo-600">AI</span> Portal
          </h1>
          <p className="text-slate-600 mt-4 max-w-xl mx-auto font-sans text-sm sm:text-base leading-relaxed">
            {mode === 'select'
              ? 'Select your authorization tier to access the Cyber-Threat-Sharing-Portal. Features and data access are strictly controlled via Role-Based Access Control (RBAC).'
              : mode === 'login'
                ? `Sign in as ${selectedRole?.name || 'a user'} to access your dashboard.`
                : `Create a new ${selectedRole?.name || ''} account.`
            }
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans text-center animate-in fade-in duration-200">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="max-w-md mx-auto mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-sans text-center">
            ✓ {successMsg}
          </div>
        )}

        {/* ─── Role Selection Cards ─── */}
        {mode === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLE_CONFIG.map((role) => (
              <div
                key={role.id}
                onClick={() => handleQuickLogin(role)}
                className={`card-glass rounded-[28px] p-7 border border-white cursor-pointer group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${role.accentColor} ${submitting ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div>
                  <div className="text-4xl mb-5 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-transform duration-200">
                    {role.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                      {role.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/60 flex justify-between items-center text-[11px] font-sans font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                  <span>Authenticate</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Login/Register Buttons ─── */}
        {mode === 'select' && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => { setMode('login'); setSelectedRole(ROLE_CONFIG[0]); }}
              className="px-5 py-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white hover:shadow-md transition-all cursor-pointer"
            >
              Sign In with Credentials
            </button>
            <button
              onClick={() => { setMode('register'); setSelectedRole(ROLE_CONFIG[0]); }}
              className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer"
            >
              Create New Account
            </button>
          </div>
        )}

        {/* ─── Login Form ─── */}
        {mode === 'login' && (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleLogin} className="card-glass rounded-[28px] p-8 space-y-5 border border-white">
              {/* Role indicator */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                <span className="text-2xl">{selectedRole?.icon || '🔐'}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedRole?.name || 'Sign In'}</h3>
                  <p className="text-[11px] text-slate-500">Enter your credentials</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                  placeholder="Your username"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-synthex-primary px-4 py-3 rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Authenticating…' : 'Sign In'}
              </button>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <button type="button" onClick={goBack} className="hover:text-slate-900 transition cursor-pointer font-semibold">
                  ← Back to roles
                </button>
                <button type="button" onClick={() => setMode('register')} className="hover:text-indigo-600 transition cursor-pointer font-semibold">
                  Create account →
                </button>
              </div>

              {/* Demo credential hints */}
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Demo Credentials</p>
                <div className="space-y-1.5">
                  {ROLE_CONFIG.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r);
                        setFormData(f => ({ ...f, username: r.defaultCredentials.username, password: r.defaultCredentials.password }));
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl bg-white/60 border border-slate-100 text-[11px] font-mono text-slate-600 hover:bg-white hover:border-slate-200 transition cursor-pointer flex justify-between"
                    >
                      <span>{r.icon} {r.defaultCredentials.username}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.badgeColor}`}>{r.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ─── Register Form ─── */}
        {mode === 'register' && (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleRegister} className="card-glass rounded-[28px] p-8 space-y-5 border border-white">
              <div className="pb-4 border-b border-slate-200/60">
                <h3 className="text-sm font-bold text-slate-900">Create Account</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Select a role and fill in your details</p>
              </div>

              {/* Role picker */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_CONFIG.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        selectedRole?.id === r.id
                          ? `${r.borderActive} bg-white shadow-sm`
                          : 'border-slate-200/60 bg-white/40 hover:bg-white/70'
                      }`}
                    >
                      <span className="text-xl block mb-1">{r.icon}</span>
                      <span className="text-[10px] font-bold text-slate-700 block leading-tight">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                  placeholder="analyst@organization.com"
                  required
                />
              </div>

              {selectedRole?.id === 'org_admin' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData(f => ({ ...f, organization: e.target.value }))}
                    className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                    placeholder="Your organization name"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 input-synthex rounded-2xl text-xs text-slate-800 font-sans"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-synthex-primary px-4 py-3 rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Creating Account…' : `Register as ${selectedRole?.name || 'User'}`}
              </button>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <button type="button" onClick={goBack} className="hover:text-slate-900 transition cursor-pointer font-semibold">
                  ← Back to roles
                </button>
                <button type="button" onClick={() => setMode('login')} className="hover:text-indigo-600 transition cursor-pointer font-semibold">
                  Already have account? Sign in →
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
