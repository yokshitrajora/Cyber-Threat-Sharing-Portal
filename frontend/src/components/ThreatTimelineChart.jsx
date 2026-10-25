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
    <div className="bg-white rounded-[32px] p-6 border border-[#e8ece5] shadow-xs space-y-5">
      
      {/* Chart Header & Controls matching Statistics Card in Reference UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e8ece5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#f4f6f2] flex items-center justify-center text-xs">📊</span>
            <h3 className="text-base font-extrabold text-[#111315] tracking-tight font-sans">
              Statistics
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Threat operations vs data transfer telemetry</p>
        </div>

        {/* Legend & Filter pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs font-sans font-medium">
            <span className="flex items-center gap-1.5 text-[#111315] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111315]"></span>
              Operations
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dbf65f] border border-[#cbe64c]"></span>
              Data Transfer
            </span>
          </div>

          <div className="flex bg-[#f4f6f2] p-1 border border-[#e8ece5] rounded-full text-xs font-sans">
            {['24h', '7d', '30d'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === t 
                    ? 'bg-[#111315] text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Area Spline Chart with Charcoal and Lime Gradients */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="charcoalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111315" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#111315" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dbf65f" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#dbf65f" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3ed" />
            
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'sans-serif' }} 
              dy={8} 
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              allowDecimals={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'sans-serif' }} 
            />

            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '18px', 
                border: '1px solid #e8ece5', 
                color: '#111315', 
                fontSize: '12px', 
                fontFamily: 'sans-serif',
                boxShadow: '0 12px 30px -5px rgba(17, 19, 21, 0.08)'
              }}
            />

            <Area 
              type="monotone" 
              dataKey="anomaly" 
              name="Operations Volume" 
              stroke="#111315" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#111315', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 5, fill: '#111315' }}
              fillOpacity={1} 
              fill="url(#charcoalGradient)" 
            />

            <Area 
              type="monotone" 
              dataKey="blocked" 
              name="Data Transfer Probe" 
              stroke="#8ba615" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#dbf65f', strokeWidth: 2, stroke: '#111315' }}
              activeDot={{ r: 5, fill: '#dbf65f' }}
              fillOpacity={1} 
              fill="url(#limeGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
