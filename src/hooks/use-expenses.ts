import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import type { Expense } from '@/lib/types';

const REFETCH_INTERVAL = 60 * 1000; // 60 seconds in milliseconds

export function useExpenses(limit?: number, autoRefresh = true) {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const url = limit ? `/api/expenses?limit=${limit}` : '/api/expenses';
      const response = await api.get(url);
      // Convert date strings to Date objects
      const expenses = response.data.map((expense: any) => ({
        ...expense,
        date: expense.date ? new Date(expense.date) : new Date(),
      }));
      setData(expenses);
    } catch (err: any) {
      setError(err.response?.data || err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [limit]);

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

