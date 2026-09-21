import axios from 'axios';

// Shield AI Threat Engine API Base URL (FastAPI Backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Axios client instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
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
    return Promise.reject(new Error(message));
  }
);

/**
 * Authentication APIs
 */
export async function login({ username, password }) {
  const data = await apiClient.post('/api/v1/auth/login', { username, password });
  if (data.access_token) {
    localStorage.setItem('shield_jwt_token', data.access_token);
  }
  return data;
}

export async function register({ username, email, password }) {
  return await apiClient.post('/api/v1/auth/register', { username, email, password });
}

export async function getCurrentUser() {
  return await apiClient.get('/api/v1/auth/me');
}

export function logout() {
  localStorage.removeItem('shield_jwt_token');
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

/**
 * Live Metrics & System Health APIs
 */
export async function getAnalytics() {
  return await apiClient.get('/api/v1/analytics');
}

export async function checkHealth() {
  return await apiClient.get('/api/v1/health');
}

export default apiClient;
