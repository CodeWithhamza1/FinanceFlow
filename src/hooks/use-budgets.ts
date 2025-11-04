import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import type { Budget } from '@/lib/types';

const REFETCH_INTERVAL = 60 * 1000; // 60 seconds in milliseconds

export function useBudgets(autoRefresh = true) {
  const [data, setData] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const response = await api.get('/api/budgets');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data || err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // Set up auto-refresh interval
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Don't show loading during auto-refresh
      }, REFETCH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, autoRefresh]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

