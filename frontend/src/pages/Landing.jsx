export default function Landing({ onLogin }) {
  const roles = [
    {
      id: 'standard',
      name: 'Standard User',
      description: 'Submit threat reports, view public feeds, and confirm community sightings.',
      icon: '👤',
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'org_admin',
      name: 'Verified Organization Admin',
      description: 'Export verified threat indicators to CSV/STIX and receive emergency alerts.',
      icon: '🏢',
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30'
    },
    {
      id: 'sys_admin',
      name: 'System Analyst / Admin',
      description: 'Override false positives, review flagged reports, and manage telemetry.',
      icon: '⚡',
      color: 'from-rose-500/20 to-rose-500/5',
      borderColor: 'border-rose-500/30'
    }
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-20 p-6">
      <div className="max-w-4xl w-full mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-white/20 to-white/5 border border-white/30 text-white shadow-xl mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-sans">
            Shield<span className="font-serif italic font-normal text-slate-300">AI</span> Portal
          </h1>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto font-sans">
            Select your authorization tier to access the Cyber-Threat-Sharing-Portal. 
            Features and data access are strictly controlled via Role-Based Access Control (RBAC).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div 
              key={role.id}
              onClick={() => onLogin(role.id)}
              className={`card-3d rounded-2xl p-6 border bg-gradient-to-b ${role.color} ${role.borderColor} cursor-pointer group hover:scale-105 transition-all duration-300`}
            >
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{role.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">{role.name}</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {role.description}
              </p>
              <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                Authenticate →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
