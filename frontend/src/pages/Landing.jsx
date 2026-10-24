export default function Landing({ onLogin }) {
  const roles = [
    {
      id: 'standard',
      name: 'Standard User',
      description: 'Submit threat reports, view public feeds, and confirm community sightings.',
      icon: '👤',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      accentColor: 'hover:border-blue-400'
    },
    {
      id: 'org_admin',
      name: 'Verified Organization Admin',
      description: 'Export verified threat indicators to CSV/STIX and receive emergency alerts.',
      icon: '🏢',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      accentColor: 'hover:border-purple-400'
    },
    {
      id: 'sys_admin',
      name: 'System Analyst / Admin',
      description: 'Override false positives, review flagged reports, and manage telemetry.',
      icon: '⚡',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      accentColor: 'hover:border-rose-400'
    }
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-20 p-6">
      <div className="max-w-4xl w-full mx-auto">
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
            Select your authorization tier to access the Cyber-Threat-Sharing-Portal. 
            Features and data access are strictly controlled via Role-Based Access Control (RBAC).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div 
              key={role.id}
              onClick={() => onLogin(role.id)}
              className={`card-glass rounded-[28px] p-7 border border-white cursor-pointer group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${role.accentColor}`}
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
      </div>
    </div>
  );
}
