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
    <div className="card-glass rounded-[28px] p-6 sm:p-7 space-y-6">
      
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
              24-Hour Threat Ingestion & Anomaly Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time threat detection volume telemetry over 24-hour cycle.</p>
        </div>

        {/* Legend & Filter pills */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-sans font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Anomalies
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Blocked
            </span>
          </div>

          <div className="flex bg-slate-100 p-1 border border-slate-200/80 rounded-full text-xs font-sans">
            {['24h', '7d', '30d'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  timeframe === t 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Area Spline Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }} 
              dy={8} 
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              allowDecimals={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }} 
            />

            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(12px)',
                borderRadius: '16px', 
                border: '1px solid rgba(226, 232, 240, 0.9)', 
                color: '#0f172a', 
                fontSize: '12px', 
                fontFamily: 'sans-serif',
                boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.1)'
              }}
            />

            <Area 
              type="monotone" 
              dataKey="anomaly" 
              name="Anomalous Traffic" 
              stroke="#6366f1" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 5, fill: '#6366f1' }}
              fillOpacity={1} 
              fill="url(#indigoGradient)" 
            />

            <Area 
              type="monotone" 
              dataKey="blocked" 
              name="Blocked Attacks" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#f43f5e', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 5, fill: '#f43f5e' }}
              fillOpacity={1} 
              fill="url(#roseGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
