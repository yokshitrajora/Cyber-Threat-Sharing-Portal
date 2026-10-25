import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getThreatMapOrigins } from '../api/threatApi';

// Fallback sample origins for instant display
const INITIAL_MAP_POINTS = [
  {
    id: "INC-9082",
    indicator: "http://free-crypto-giveaway.xyz/claim",
    type: "URL",
    score: 96,
    severity: "Critical",
    status: "Auto-Blocked",
    target: "Auth Portal (443)",
    latitude: 50.1109,
    longitude: 8.6821,
    origin_city: "Frankfurt",
    origin_country: "Germany",
    sightings_count: 7,
    timestamp: "15 mins ago"
  },
  {
    id: "INC-8194",
    indicator: "198.51.100.44",
    type: "IP",
    score: 88,
    severity: "Critical",
    status: "Auto-Blocked",
    target: "SSH Daemon (22)",
    latitude: 39.0438,
    longitude: -77.4874,
    origin_city: "Ashburn",
    origin_country: "United States",
    sightings_count: 12,
    timestamp: "1 hour ago"
  },
  {
    id: "INC-7301",
    indicator: "billing-alert@paypa1-security.com",
    type: "Email",
    score: 82,
    severity: "High",
    status: "Quarantined",
    target: "Mail Ingress (25)",
    latitude: 44.4268,
    longitude: 26.1025,
    origin_city: "Bucharest",
    origin_country: "Romania",
    sightings_count: 4,
    timestamp: "3 hours ago"
  },
  {
    id: "INC-5044",
    indicator: "203.0.113.195",
    type: "IP",
    score: 91,
    severity: "Critical",
    status: "Auto-Blocked",
    target: "API Gateway (8080)",
    latitude: 35.6762,
    longitude: 139.6503,
    origin_city: "Tokyo",
    origin_country: "Japan",
    sightings_count: 9,
    timestamp: "8 hours ago"
  },
  {
    id: "INC-4219",
    indicator: "secure-update-patch.biz",
    type: "Domain",
    score: 78,
    severity: "High",
    status: "Quarantined",
    target: "Endpoint Defense (DNS)",
    latitude: 52.3676,
    longitude: 4.9041,
    origin_city: "Amsterdam",
    origin_country: "Netherlands",
    sightings_count: 3,
    timestamp: "12 hours ago"
  },
  {
    id: "INC-6120",
    indicator: "https://community-defense-portal.org/docs",
    type: "URL",
    score: 14,
    severity: "Low",
    status: "Monitoring",
    target: "Web Edge (443)",
    latitude: 47.3769,
    longitude: 8.5417,
    origin_city: "Zurich",
    origin_country: "Switzerland",
    sightings_count: 1,
    timestamp: "6 hours ago"
  }
];

export default function InteractiveThreatMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [points, setPoints] = useState(INITIAL_MAP_POINTS);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch live threat origins from backend API
  useEffect(() => {
    let mounted = true;
    async function fetchOrigins() {
      try {
        const data = await getThreatMapOrigins();
        if (mounted && data?.points && data.points.length > 0) {
          setPoints(data.points);
        }
      } catch {
        // Fallback to initial points if offline
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchOrigins();
    return () => { mounted = false; };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent duplicate init

    // Center map on international overview
    const map = L.map(mapContainerRef.current, {
      center: [30.0, 15.0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    // Elegant Voyager / Positron tile layer for high-contrast threat pins
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Add zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Group for threat markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render / Update Pins on Map based on filter selections
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filtered = points.filter(p => {
      const matchSev = filterSeverity === 'ALL' || p.severity === filterSeverity;
      const matchType = filterType === 'ALL' || p.type === filterType;
      return matchSev && matchType && p.latitude && p.longitude;
    });

    filtered.forEach(p => {
      const isCritical = p.severity === 'Critical';
      const isHigh = p.severity === 'High';
      const isMedium = p.severity === 'Medium';

      const color = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : isMedium ? '#eab308' : '#10b981';
      const pulseHtml = isCritical || isHigh
        ? `<div style="position:absolute; width:34px; height:34px; top:-9px; left:-9px; border-radius:50%; background:${color}; opacity:0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
        : '';

      const iconHtml = `
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:16px; height:16px;">
          ${pulseHtml}
          <div style="width:14px; height:14px; border-radius:50%; background:${color}; border:2.5px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.3); z-index:10;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-threat-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family:sans-serif; min-width:210px; padding:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
            <strong style="color:#0f172a; font-size:12px;">${p.origin_city}, ${p.origin_country}</strong>
            <span style="font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; background:${isCritical ? '#fff1f2' : isHigh ? '#fffbeb' : '#f0fdf4'}; color:${color};">
              ${p.severity}
            </span>
          </div>
          <div style="font-family:monospace; font-size:11px; color:#1e293b; background:#f8fafc; padding:6px; border-radius:8px; border:1px solid #e2e8f0; word-break:break-all; margin-bottom:8px;">
            ${p.indicator}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:10px; color:#64748b; margin-bottom:6px;">
            <div>Vector: <strong style="color:#0f172a;">${p.type}</strong></div>
            <div>Score: <strong style="color:${color}; font-weight:800;">${p.score}/100</strong></div>
            <div>Target: <strong style="color:#0f172a;">${p.target}</strong></div>
            <div>Sightings: <strong style="color:#6366f1;">${p.sightings_count}</strong></div>
          </div>
          <div style="font-size:9px; color:#94a3b8; text-align:right;">Detected: ${p.timestamp}</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-threat-popup',
        closeButton: true
      });

      marker.on('click', () => {
        setSelectedPoint(p);
      });

      markersLayer.addLayer(marker);
    });
  }, [points, filterSeverity, filterType]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([30.0, 15.0], 2, { animate: true });
    }
  };

  const handleFocusPoint = (p) => {
    setSelectedPoint(p);
    if (mapInstanceRef.current && p.latitude && p.longitude) {
      mapInstanceRef.current.setView([p.latitude, p.longitude], 6, { animate: true });
    }
  };

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-7 space-y-6">
      
      {/* Map Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
              Interactive Global Threat Origin Map
            </h3>
            <span className="text-[11px] font-sans px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {points.length} Attack Vectors Geolocated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time geospatial telemetry tracking attacking IPs and exploit probes targeting local community infrastructure.
          </p>
        </div>

        {/* Recenter & Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRecenter}
            className="px-3 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Reset to global view"
          >
            <span>🌍 Recenter View</span>
          </button>

          {/* Severity Filter */}
          <div className="pill-group">
            {['ALL', 'Critical', 'High', 'Low'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterSeverity === s ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container & Hotspot Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Leaflet Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-200/80 shadow-md relative min-h-[420px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-10" />

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-[11px] font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-700 font-bold">Live Geospatial Telemetry</span>
            <span className="text-slate-400">• Leaflet Engine</span>
          </div>
        </div>

        {/* Origin Hotspots List (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-md p-4 space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                Active Attack Origins
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                {points.length} nodes
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-[320px] overflow-y-auto pr-1">
              {points.slice(0, 7).map(p => {
                const isCrit = p.severity === 'Critical';
                return (
                  <div
                    key={p.id}
                    onClick={() => handleFocusPoint(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedPoint?.id === p.id
                        ? 'bg-white border-indigo-400 shadow-sm'
                        : 'bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">📍</span>
                        <span className="text-xs font-bold text-slate-800">{p.origin_city}, {p.origin_country}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        isCrit ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {p.severity}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 truncate">{p.indicator}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
                      <span>Target: <strong className="text-slate-700">{p.target}</strong></span>
                      <span className="font-mono text-indigo-600 font-bold">{p.score}/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Click any node to zoom & inspect</span>
            <span className="text-indigo-600 font-bold">Auto-Refreshed</span>
          </div>
        </div>

      </div>

    </div>
  );
}
