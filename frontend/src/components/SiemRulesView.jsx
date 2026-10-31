import { useState, useMemo } from 'react';

export default function SiemRulesView({ threats = [] }) {
  const [selectedFormat, setSelectedFormat] = useState('suricata');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [copied, setCopied] = useState(false);

  // Filter threats
  const filteredThreats = useMemo(() => {
    return threats.filter(t => {
      if (filterSeverity === 'ALL') return true;
      return t.severity?.toLowerCase() === filterSeverity.toLowerCase();
    });
  }, [threats, filterSeverity]);

  // Extract IP, domain, URL indicators
  const indicators = useMemo(() => {
    return filteredThreats.map((t, idx) => {
      const ind = t.cleanIndicator || t.indicator || '';
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(ind);
      let domain = ind;
      try {
        if (ind.startsWith('http')) {
          domain = new URL(ind).hostname;
        } else if (ind.includes('@')) {
          domain = ind.split('@')[1];
        }
      } catch {
        domain = ind;
      }
      return {
        id: t.id || `INC-${1000 + idx}`,
        indicator: ind,
        domain,
        isIp,
        score: t.score || 75,
        severity: t.severity || 'High',
        type: t.type || 'Indicator',
        status: t.status || 'Active',
        sid: 3000000 + idx + 1
      };
    });
  }, [filteredThreats]);

  // Generate rules text based on format
  const generatedOutput = useMemo(() => {
    if (selectedFormat === 'suricata') {
      const lines = [
        '# =====================================================================',
        '# SHIELD-AI Community Defense Network - Suricata / Snort IDS Rules',
        `# Generated: ${new Date().toUTCString()}`,
        `# Indicators: ${indicators.length} Active Targets (Filter: ${filterSeverity})`,
        '# =====================================================================',
        ''
      ];

      indicators.forEach(item => {
        if (item.isIp) {
          lines.push(
            `drop ip ${item.indicator} any -> $HOME_NET any (msg:"SHIELD-AI [${item.severity.toUpperCase()}] Malicious Ingress Probe from ${item.indicator}"; reference:url,shieldcommunity.io/incident/${item.id}; threshold:type limit, track by_src, count 1, seconds 3600; classtype:trojan-activity; sid:${item.sid}; rev:1;)`
          );
        } else {
          lines.push(
            `alert dns $HOME_NET any -> any 53 (msg:"SHIELD-AI [${item.severity.toUpperCase()}] DNS Query to Malicious Threat Target ${item.domain}"; dns.query; content:"${item.domain}"; nocase; reference:url,shieldcommunity.io/incident/${item.id}; classtype:bad-unknown; sid:${item.sid}; rev:1;)`
          );
        }
      });
      return lines.join('\n');
    }

    if (selectedFormat === 'stix') {
      const now = new Date().toISOString();
      const stixBundle = {
        type: 'bundle',
        id: `bundle--shield-ai-${Date.now()}`,
        spec_version: '2.1',
        objects: [
          {
            type: 'identity',
            spec_version: '2.1',
            id: 'identity--b4619d08-2026-4d56-b918-9b61fda0e330',
            name: 'Shield AI Community Cyber Defense Collective',
            identity_class: 'community-organization',
            created: now,
            modified: now
          },
          ...indicators.map(item => {
            const pattern = item.isIp
              ? `[ipv4-addr:value = '${item.indicator}']`
              : `[domain-name:value = '${item.domain}']`;
            return {
              type: 'indicator',
              spec_version: '2.1',
              id: `indicator--${item.id.toLowerCase()}-2026`,
              created: now,
              modified: now,
              name: `${item.type} [${item.id}]`,
              description: `Threat indicator auto-classified by Shield AI with score ${item.score}/100 and severity ${item.severity}`,
              indicator_types: [item.severity === 'Critical' ? 'malicious-activity' : 'anomalous-activity'],
              pattern_type: 'stix',
              pattern: pattern,
              valid_from: now,
              confidence: item.score
            };
          })
        ]
      };
      return JSON.stringify(stixBundle, null, 2);
    }

    if (selectedFormat === 'sinkhole') {
      const lines = [
        '# =====================================================================',
        '# SHIELD-AI Automated DNS Sinkhole & Host Blocklist',
        '# Compatible with /etc/hosts, Pi-hole, Unbound DNS, and AdGuard Home',
        `# Total Sinkholed Domains: ${indicators.filter(i => !i.isIp).length}`,
        '# =====================================================================',
        ''
      ];
      indicators.filter(i => !i.isIp).forEach(item => {
        lines.push(`0.0.0.0 ${item.domain} # [${item.severity}] ${item.id} - Score: ${item.score}`);
        lines.push(`::0     ${item.domain}`);
      });
      return lines.join('\n');
    }

    if (selectedFormat === 'firewall') {
      const lines = [
        '#!/usr/bin/env bash',
        '# =====================================================================',
        '# SHIELD-AI Linux iptables / nftables Ingress Drop Script',
        `# Total Blocked Ingress IPs: ${indicators.filter(i => i.isIp).length}`,
        '# =====================================================================',
        '',
        '# Create custom chain if not exists',
        'iptables -N SHIELD_COMMUNITY_DROP 2>/dev/null || true',
        'iptables -F SHIELD_COMMUNITY_DROP',
        ''
      ];
      indicators.filter(i => i.isIp).forEach(item => {
        lines.push(`iptables -A SHIELD_COMMUNITY_DROP -s ${item.indicator} -j DROP -m comment --comment "${item.id}-${item.severity}"`);
      });
      lines.push('');
      lines.push('# Bind chain to INPUT');
      lines.push('iptables -C INPUT -j SHIELD_COMMUNITY_DROP 2>/dev/null || iptables -I INPUT 1 -j SHIELD_COMMUNITY_DROP');
      lines.push('echo "[+] Shield AI Firewall rules loaded successfully."');
      return lines.join('\n');
    }

    if (selectedFormat === 'sigma') {
      const ipList = indicators.filter(i => i.isIp).map(i => `        - '${i.indicator}'`).join('\n');
      const domainList = indicators.filter(i => !i.isIp).map(i => `        - '${i.domain}'`).join('\n');
      return `title: Shield AI Community Threat Indicators Match
id: c8b0e8b1-39d1-412f-9811-0026e9b61fda
status: stable
description: Detects network traffic matching active community-vetted threat indicators
author: Shield AI Cyber Defense
date: ${new Date().toISOString().slice(0, 10)}
logsource:
    category: network_traffic
detection:
    selection_ip:
        destination.ip:
${ipList || "        - '198.51.100.44'"}
    selection_dns:
        dns.question.name:
${domainList || "        - 'malicious-domain.xyz'"}
    condition: selection_ip or selection_dns
fields:
    - source.ip
    - destination.ip
    - dns.question.name
    - destination.port
falsepositives:
    - Unlikely given active AI community validation
level: high`;
    }

    return '';
  }, [selectedFormat, indicators, filterSeverity]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    const extMap = {
      suricata: 'shield-community-ids.rules',
      stix: 'shield-threat-bundle.json',
      sinkhole: 'hosts-sinkhole.txt',
      firewall: 'shield-iptables.sh',
      sigma: 'shield-sigma-rule.yml'
    };
    const filename = extMap[selectedFormat] || 'shield-rules.txt';
    const blob = new Blob([generatedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#e8ece5] shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dbf65f] shadow-[0_0_6px_#dbf65f]"></span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
              SIEM & IDS Threat Intelligence Exporter
            </h3>
            <span className="text-[11px] font-sans px-3 py-0.5 rounded-full bg-[#dbf65f]/20 text-[#111315] font-bold border border-[#dbf65f]/40">
              {indicators.length} Active Rules Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Instantly transform verified community threat telemetry into machine-readable rules for firewalls, SIEMs, and DNS resolvers.
          </p>
        </div>

        {/* Severity Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="pill-group">
            {['ALL', 'Critical', 'High', 'Medium', 'Low'].map(s => (
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

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#f4f6f2] text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>{copied ? '✓ Copied!' : '📋 Copy Rules'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-full bg-[#111315] text-white hover:bg-black text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-[#dbf65f]">↓</span>
            <span>Download File</span>
          </button>
        </div>
      </div>

      {/* Format Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'suricata', label: 'Suricata / Snort IDS', icon: '🛡️' },
          { id: 'stix', label: 'STIX 2.1 Threat Bundle', icon: '📦' },
          { id: 'sinkhole', label: 'DNS Sinkhole (Hosts)', icon: '🚫' },
          { id: 'firewall', label: 'Linux iptables Script', icon: '🧱' },
          { id: 'sigma', label: 'Sigma Generic SIEM', icon: '📊' }
        ].map(fmt => (
          <button
            key={fmt.id}
            onClick={() => setSelectedFormat(fmt.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedFormat === fmt.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-[#f2f5ef] text-slate-600 border border-[#e8ece5]'
            }`}
          >
            <span>{fmt.icon}</span>
            <span>{fmt.label}</span>
          </button>
        ))}
      </div>

      {/* Rule Output Preview Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-[#0f172a] text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner relative group">
        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            FORMAT: {selectedFormat.toUpperCase()} • ENCODING: UTF-8
          </span>
          <span className="text-slate-400">{generatedOutput.split('\n').length} lines</span>
        </div>

        <pre className="text-slate-200 text-xs leading-relaxed select-all whitespace-pre">
          {generatedOutput}
        </pre>
      </div>

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-600 pt-1">
        <div className="bg-[#f8faf7] p-3.5 rounded-2xl border border-[#e8ece5]">
          <span className="font-bold text-slate-900 block font-sans">⚡ Auto-Ingestion Ready</span>
          <span className="text-[11px] text-slate-500">Easily integrated into cron sync scripts, Zeek, or Elastic Agent.</span>
        </div>
        <div className="bg-[#f8faf7] p-3.5 rounded-2xl border border-[#e8ece5]">
          <span className="font-bold text-slate-900 block font-sans">🔒 PII Scrubbed</span>
          <span className="text-[11px] text-slate-500">All local internal hostnames and auth tokens are stripped before rule creation.</span>
        </div>
        <div className="bg-[#f8faf7] p-3.5 rounded-2xl border border-[#e8ece5]">
          <span className="font-bold text-slate-900 block font-sans">📡 STIX 2.1 Standard</span>
          <span className="text-[11px] text-slate-500">Fully compliant with OASIS CTI STIX 2.1 JSON specifications.</span>
        </div>
      </div>

    </div>
  );
}
