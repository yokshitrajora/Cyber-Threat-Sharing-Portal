import { useState, useEffect, useCallback } from 'react';
import { RECENT_INCIDENTS } from '../data/mockThreats';
import { getThreats, updateThreatStatus, deleteThreat } from '../api/threatApi';

export function useThreats() {
  const [threats, setThreats] = useState(RECENT_INCIDENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreats();
      const threatList = Array.isArray(data) ? data : data.threats;
      if (Array.isArray(threatList) && threatList.length > 0) {
        setThreats(threatList);
        setIsLiveConnected(true);
      }
    } catch (err) {
      // Keep initial RECENT_INCIDENTS dataset when server API is offline
      setIsLiveConnected(false);
      setError(err.message || 'Offline mode: using fallback cache.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  const addThreat = useCallback((newThreat) => {
    setThreats(prev => [newThreat, ...prev]);
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    try {
      await updateThreatStatus(id, status);
      setThreats(prev => prev.map(t => (t.id === id || t.numericId === id) ? { ...t, status } : t));
      return true;
    } catch {
      // Optimistic fallback update for offline mode
      setThreats(prev => prev.map(t => (t.id === id || t.numericId === id) ? { ...t, status } : t));
      return false;
    }
  }, []);

  const removeThreat = useCallback(async (id) => {
    try {
      await deleteThreat(id);
      setThreats(prev => prev.filter(t => t.id !== id && t.numericId !== id));
      return true;
    } catch {
      // Optimistic fallback remove for offline mode
      setThreats(prev => prev.filter(t => t.id !== id && t.numericId !== id));
      return false;
    }
  }, []);

  return {
    threats,
    loading,
    error,
    isLiveConnected,
    refreshThreats: fetchThreats,
    addThreat,
    updateStatus,
    removeThreat
  };
}
