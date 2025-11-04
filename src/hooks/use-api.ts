import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useApi<T>(
  endpoint: string,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data || err.message);
      console.error(`API Error (${endpoint}):`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    fetchData();

    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [endpoint, options?.enabled, options?.refetchInterval]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
}

