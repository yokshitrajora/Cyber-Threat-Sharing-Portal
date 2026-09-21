import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { THREAT_TIMELINE_DATA } from '../data/mockThreats';
import { getAnalytics } from '../api/threatApi';

export default function ThreatTimelineChart() {
  const [timeframe, setTimeframe] = useState('24h');
  const [chartData, setChartData] = useState(THREAT_TIMELINE_DATA);

  useEffect(() => {
    let mounted = true;
    async function loadTimeline() {
      try {
        const data = await getAnalytics();
        if (mounted && data?.timeline && Array.isArray(data.timeline)) {
          setChartData(data.timeline);
        }
      } catch {
        // Use default THREAT_TIMELINE_DATA if offline
      }
    }
    loadTimeline();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card-3d rounded-2xl p-5 space-y-4">
      
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-200 animate-pulse"></span>
              24-Hour Threat Ingestion & Anomaly Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time threat detection volume telemetry over 24-hour cycle.</p>
        </div>

        {/* Legend & Filter pills */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              Anomalies
            </span>
            <span className="flex items-center gap-1.5 text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              Blocked
            </span>
          </div>

          <div className="flex bg-black/40 p-1 border border-white/15 rounded-xl text-xs font-mono backdrop-blur-md">
            {['24h', '7d', '30d'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === t 
                    ? 'btn-3d-primary py-0.5 px-2.5 rounded-lg text-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Responsive Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
            
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
              dy={8} 
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              allowDecimals={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
            />

            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(10, 14, 24, 0.95)', 
                borderRadius: '12px', 
                borderColor: 'rgba(255, 255, 255, 0.2)', 
                color: '#ffffff', 
                fontSize: '12px', 
                fontFamily: 'monospace',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
              }}
            />

            <Area 
              type="monotone" 
              dataKey="anomaly" 
              name="Anomalous Traffic" 
              stroke="#ffffff" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#silverGradient)" 
            />

            <Area 
              type="monotone" 
              dataKey="blocked" 
              name="Blocked Attacks" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#roseGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
