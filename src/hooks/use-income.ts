import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

export interface IncomeEntry {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
}

const REFETCH_INTERVAL = 60 * 1000; // 60 seconds in milliseconds

export function useIncome(month?: string, autoRefresh = true) {
  const [data, setData] = useState<{ entries: IncomeEntry[]; total: number }>({ entries: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const url = month ? `/api/income?month=${month}` : '/api/income';
      const response = await api.get(url);
      setData({
        entries: response.data.entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
        })),
        total: response.data.total,
      });
    } catch (err: any) {
      setError(err.response?.data || err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [month]);

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

