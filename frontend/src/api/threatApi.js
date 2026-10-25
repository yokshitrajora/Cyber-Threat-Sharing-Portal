import axios from 'axios';

// Shield AI Threat Engine API Base URL (FastAPI Backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Axios client instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor: Attach JWT Bearer token if stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shield_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract data or format descriptive error
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      'Backend engine communication error';
    const err = new Error(message);
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

/**
 * Authentication APIs
 */
export async function login({ username, password }) {
  const data = await apiClient.post('/api/v1/auth/login', { username, password });
  if (data.access_token) {
    localStorage.setItem('shield_jwt_token', data.access_token);
    localStorage.setItem('shield_user_role', data.role || 'standard');
    localStorage.setItem('shield_username', data.username || username);
    if (data.user) {
      localStorage.setItem('shield_user', JSON.stringify(data.user));
    }
  }
  return data;
}

export async function quickLogin(role) {
  const data = await apiClient.post('/api/v1/auth/quick-login', { role });
  if (data.access_token) {
    localStorage.setItem('shield_jwt_token', data.access_token);
    localStorage.setItem('shield_user_role', data.role || role);
    localStorage.setItem('shield_username', data.username || 'user');
    if (data.user) {
      localStorage.setItem('shield_user', JSON.stringify(data.user));
    }
  }
  return data;
}

export async function register({ username, email, password, role, organization }) {
  return await apiClient.post('/api/v1/auth/register', {
    username, email, password,
    role: role || 'standard',
    organization: organization || ''
  });
}

export async function getCurrentUser() {
  return await apiClient.get('/api/v1/auth/me');
}

export function logout() {
  localStorage.removeItem('shield_jwt_token');
  localStorage.removeItem('shield_user_role');
  localStorage.removeItem('shield_username');
  localStorage.removeItem('shield_user');
}

export function getStoredAuth() {
  const token = localStorage.getItem('shield_jwt_token');
  const role = localStorage.getItem('shield_user_role');
  const username = localStorage.getItem('shield_username');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('shield_user')); } catch {}
  if (token && role) {
    return { token, role, username, user };
  }
  return null;
}

/**
 * Threat Intelligence & STIX 2.1 APIs
 */
export async function getThreats(params = {}) {
  return await apiClient.get('/api/v1/threats', { params });
}

export async function getThreatById(id) {
  return await apiClient.get(`/api/v1/threats/${id}`);
}

export async function submitThreat({ threatData, description }) {
  return await apiClient.post('/api/v1/threats/report', {
    threat_data: threatData,
    description: description || ''
  });
}

export async function updateThreatStatus(id, status) {
  return await apiClient.patch(`/api/v1/threats/${id}/status`, { status });
}

export async function deleteThreat(id) {
  return await apiClient.delete(`/api/v1/threats/${id}`);
}

export async function reportSighting(id) {
  return await apiClient.post(`/api/v1/threats/${id}/sightings`);
}

export async function reportFalseAlarm(id) {
  return await apiClient.post(`/api/v1/threats/${id}/false-alarms`);
}

export async function verifyThreat(id) {
  return await apiClient.post(`/api/v1/threats/${id}/verify`);
}

export async function overrideFalsePositive(id) {
  return await apiClient.post(`/api/v1/threats/${id}/override-false-positive`);
}

export async function broadcastEmergencyAlert({ title, message, threat_id, severity }) {
  return await apiClient.post('/api/v1/threats/broadcast/emergency', {
    title, message, threat_id, severity: severity || 'Critical'
  });
}

export function getExportUrl(format) {
  const token = localStorage.getItem('shield_jwt_token');
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
  return `${API_BASE_URL}/api/v1/threats/export/rules?format=${format}${tokenParam}`;
}

export async function downloadThreatExport(format) {
  const token = localStorage.getItem('shield_jwt_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/threats/export/rules?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Export failed' }));
    throw new Error(err.detail || 'Export failed');
  }
  const blob = await res.blob();
  const filename = format === 'csv' ? 'shield_threats.csv' : format === 'stix' ? 'shield_stix_bundle.json' : 'shield_blocklist.hosts';
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Interactive Threat Map APIs
 */
export async function getThreatMapOrigins() {
  return await apiClient.get('/api/v1/threats/map/origins');
}

/**
 * Weekly Community Cyber-Threat Email Digest APIs
 */
export async function subscribeWeeklyDigest({ email, organization_name, sector }) {
  return await apiClient.post('/api/v1/digest/subscribe', {
    email,
    organization_name,
    sector: sector || 'General Business'
  });
}

export async function getDigestSubscribers() {
  return await apiClient.get('/api/v1/digest/subscribers');
}

export async function getDigestPreview(organization) {
  return await apiClient.get('/api/v1/digest/preview', {
    params: organization ? { organization } : {}
  });
}

export async function triggerWeeklyDigest() {
  return await apiClient.post('/api/v1/digest/trigger-send');
}

export async function unsubscribeDigest(email) {
  return await apiClient.delete(`/api/v1/digest/unsubscribe/${encodeURIComponent(email)}`);
}

/**
 * Live Metrics & System Health APIs
 */
export async function getAnalytics() {
  return await apiClient.get('/api/v1/analytics');
}

export async function checkHealth() {
  return await apiClient.get('/api/v1/analytics/health');
}

export default apiClient;
