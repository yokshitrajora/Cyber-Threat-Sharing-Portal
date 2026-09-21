// Dribbble-grade AI Cybersecurity Threat Detection System Dataset

export const DASHBOARD_METRICS = {
  activeThreats: {
    value: '1,482',
    change: '+14.2%',
    trend: 'up',
    subtext: '34 critical alerts requires triage'
  },
  aiAccuracy: {
    value: '99.6%',
    change: '+0.4%',
    trend: 'up',
    subtext: 'Neural Threat Engine v4.2'
  },
  mttd: {
    value: '0.8s',
    change: '-22.4%',
    trend: 'down', // down is good for MTTD
    subtext: 'Avg response time 1.4s'
  },
  monitoredNodes: {
    value: '4,890',
    change: '+120 new',
    trend: 'up',
    subtext: '100% agent telemetry sync'
  }
};

export const THREAT_TIMELINE_DATA = [
  { time: '00:00', anomaly: 12, blocked: 45, normal: 320 },
  { time: '03:00', anomaly: 18, blocked: 52, normal: 310 },
  { time: '06:00', anomaly: 25, blocked: 68, normal: 450 },
  { time: '09:00', anomaly: 64, blocked: 120, normal: 890 },
  { time: '12:00', anomaly: 82, blocked: 155, normal: 1020 },
  { time: '15:00', anomaly: 55, blocked: 110, normal: 940 },
  { time: '18:00', anomaly: 40, blocked: 88, normal: 780 },
  { time: '21:00', anomaly: 28, blocked: 60, normal: 520 },
];

export const CATEGORY_BREAKDOWN = [
  { name: 'Malware & Ransomware', value: 38, count: 563, color: '#f43f5e' },
  { name: 'Phishing & Typosquatting', value: 29, count: 430, color: '#06b6d4' },
  { name: 'DDoS & Traffic Spikes', value: 21, count: 311, color: '#f97316' },
  { name: 'Brute Force & Scan Probes', value: 12, count: 178, color: '#3b82f6' },
];

export const RECENT_INCIDENTS = [
  {
    id: 'INC-9082',
    severity: 'Critical',
    score: 96,
    aiConfidence: '99.8%',
    indicator: 'http://free-token-drop.xyz/auth?token=usr_99812a',
    cleanIndicator: 'http://free-token-drop.xyz/auth',
    type: 'Phishing Domain',
    target: 'Auth Service (443)',
    location: 'Frankfurt, DE (AS24940)',
    status: 'Auto-Blocked',
    timestamp: 'Just now',
    sanitized: ['token=usr_99812a']
  },
  {
    id: 'INC-9081',
    severity: 'Critical',
    score: 89,
    aiConfidence: '98.5%',
    indicator: '198.51.100.44',
    cleanIndicator: '198.51.100.44',
    type: 'Malicious Host',
    target: 'SSH Probe (22)',
    location: 'Sao Paulo, BR (AS12583)',
    status: 'Isolated',
    timestamp: '4m ago',
    sanitized: []
  },
  {
    id: 'INC-9080',
    severity: 'High',
    score: 76,
    aiConfidence: '96.2%',
    indicator: 'billing-alert@paypa1-security.com',
    cleanIndicator: 'billing-alert@paypa1-security.com',
    type: 'Typosquat Domain',
    target: 'Mail Gateway (25)',
    location: 'Amsterdam, NL (AS1103)',
    status: 'Quarantined',
    timestamp: '12m ago',
    sanitized: []
  },
  {
    id: 'INC-9079',
    severity: 'High',
    score: 72,
    aiConfidence: '94.8%',
    indicator: '192.0.2.14',
    cleanIndicator: '192.0.2.14',
    type: 'Scanner Node',
    target: 'Web API (8080)',
    location: 'Tokyo, JP (AS2514)',
    status: 'Rate Limited',
    timestamp: '28m ago',
    sanitized: []
  },
  {
    id: 'INC-9078',
    severity: 'Medium',
    score: 48,
    aiConfidence: '91.0%',
    indicator: 'dns-exploit-payload.site',
    cleanIndicator: 'dns-exploit-payload.site',
    type: 'DNS Tunnel',
    target: 'DNS Server (53)',
    location: 'Virginia, US (AS14618)',
    status: 'Under Analysis',
    timestamp: '42m ago',
    sanitized: []
  },
  {
    id: 'INC-9077',
    severity: 'Low',
    score: 22,
    aiConfidence: '88.4%',
    indicator: '198.51.100.109',
    cleanIndicator: '198.51.100.109',
    type: 'Diagnostic Ping',
    target: 'ICMP Probe',
    location: 'London, UK (AS5089)',
    status: 'Passed',
    timestamp: '1h ago',
    sanitized: []
  }
];

export const THREAT_PRESETS = [
  {
    id: 'p-1',
    label: 'Crypto Phish URL with Token',
    indicator: 'http://free-token-drop.xyz/auth?session=usr_99812a&token=secret_9912',
    category: 'Phishing Domain',
    desc: 'Automated credential harvester targeting web3 wallets'
  },
  {
    id: 'p-2',
    label: 'SYN Flood Scanner IP',
    indicator: '198.51.100.44',
    category: 'Malicious Host',
    desc: 'Unsolicited port scanner targeting SSH and HTTPS ports'
  },
  {
    id: 'p-3',
    label: 'Spoofed Typosquat Email',
    indicator: 'billing-alert@paypa1-security.com',
    category: 'Typosquat Domain',
    desc: 'Phishing email domain designed to impersonate financial support'
  }
];

export const SYSTEM_HEALTH = {
  cpuUsage: 34,
  memoryUsage: 58,
  ingestionRate: '2.4k req/sec',
  activeAgents: 4890,
  activeEngine: 'Shield AI Neural Engine v4.2',
  dbType: 'SQLite Persistent Core',
  status: 'OPTIMAL'
};
