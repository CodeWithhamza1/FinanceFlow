import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface CurrencyConversion {
  convertedAmount: number;
  rate: number;
  from: string;
  to: string;
}

export function useCurrencyConversion() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const convertCurrency = useCallback(async (
    amount: number,
    from: string,
    to: string
  ): Promise<number> => {
    if (from === to) return amount;

    try {
      const response = await api.get<CurrencyConversion>(
        `/api/currency/convert?from=${from}&to=${to}&amount=${amount}`
      );
      return response.data.convertedAmount;
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount; // Fallback to original amount
    }
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, []);

  return {
    convertCurrency,
    formatCurrency,
    loading,
  };
}

