import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, quickLogin as apiQuickLogin, logout as apiLogout, getStoredAuth, getCurrentUser } from '../api/threatApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, username, email, role, organization, is_superuser }
  const [role, setRole] = useState(null);         // 'standard' | 'org_admin' | 'sys_admin'
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setToken(stored.token);
      setRole(stored.role);
      setUser(stored.user);
      // Optionally verify token with /me
      getCurrentUser().then(u => {
        setUser(u);
        setRole(u.role);
      }).catch(() => {
        // Token expired, clear
        apiLogout();
        setToken(null);
        setRole(null);
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const data = await apiLogin({ username, password });
      setToken(data.access_token);
      setRole(data.role);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const quickLogin = useCallback(async (chosenRole) => {
    setError(null);
    try {
      const data = await apiQuickLogin(chosenRole);
      setToken(data.access_token);
      setRole(data.role);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async ({ username, email, password, role: chosenRole, organization }) => {
    setError(null);
    try {
      const newUser = await apiRegister({ username, email, password, role: chosenRole, organization });
      // Auto-login after registration
      const data = await apiLogin({ username, password });
      setToken(data.access_token);
      setRole(data.role);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setToken(null);
    setRole(null);
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = !!token && !!role;
  const hasRole = useCallback((r) => {
    if (!role) return false;
    if (role === 'sys_admin') return true; // sys_admin has all access
    if (Array.isArray(r)) return r.includes(role);
    return role === r;
  }, [role]);

  return (
    <AuthContext.Provider value={{
      user, role, token, loading, error,
      isAuthenticated, hasRole,
      login, quickLogin, register, logout, setError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
