import { useState, useEffect, useRef } from 'react';
import { convertCurrency, getCachedRatesFromStorage } from '@/lib/currency-utils';

interface UseCurrencyAmountOptions {
  fromCurrency?: string; // Source currency (default: USD)
  toCurrency?: string;   // Target currency (default: USD)
  forceRefresh?: boolean; // Force API call even if cache exists
}

export function useCurrencyAmount(amount: number, toCurrency: string, options?: UseCurrencyAmountOptions) {
  const fromCurrency = options?.fromCurrency || 'USD';
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [loading, setLoading] = useState(false);
  const lastCurrencyRef = useRef<string>(toCurrency);

  useEffect(() => {
    // CONVERSION DISABLED - Always return original amount
    setConvertedAmount(amount);
    return;
    
    /* COMMENTED OUT - CONVERSION LOGIC
    const convert = async () => {
      if (fromCurrency === toCurrency || !toCurrency) {
        setConvertedAmount(amount);
        return;
      }

      // Check if we have cached rates - if yes, use them without API call
      // For USD -> PKR: cache is keyed by PKR, rate stored is "PKR per USD"
      // For PKR -> USD: cache is keyed by PKR, rate stored is "PKR per USD" 
      let cachedRates: Record<string, number> | null = null;
      let rate: number | undefined;
      
      if (fromCurrency === 'USD' && toCurrency !== 'USD') {
        // Converting USD -> PKR: look for cache keyed by PKR
        cachedRates = getCachedRatesFromStorage(toCurrency);
        if (cachedRates && cachedRates[toCurrency]) {
          rate = cachedRates[toCurrency]; // Rate is "PKR per USD"
        }
      } else if (toCurrency === 'USD' && fromCurrency !== 'USD') {
        // Converting PKR -> USD: look for cache keyed by PKR
        cachedRates = getCachedRatesFromStorage(fromCurrency);
        if (cachedRates && cachedRates[fromCurrency]) {
          rate = cachedRates[fromCurrency]; // Rate is "PKR per USD"
        }
      }
      
      if (rate && !options?.forceRefresh) {
        // Use cached rate for immediate conversion - no API call
        let converted: number;
        if (toCurrency === 'USD' && fromCurrency !== 'USD') {
          // Converting TO USD: divide by rate (PKR per USD)
          // Example: 65000 PKR / 283.5 = 229.45 USD
          // Keep maximum precision for storage
          converted = amount / rate;
        } else if (fromCurrency === 'USD' && toCurrency !== 'USD') {
          // Converting FROM USD: multiply by rate (PKR per USD)
          // Example: 229.45 USD * 283.5 = 65000 PKR
          converted = amount * rate;
          
          // Round based on target currency for display
          const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
          if (noDecimalsCurrencies.includes(toCurrency)) {
            // Use clean Math.round for whole number currencies
            converted = Math.round(converted);
          }
        } else {
          converted = amount;
        }
        
        setConvertedAmount(converted);
        setLoading(false);
        return;
      }

      // If no cache and not forcing refresh, show USD amount (no conversion)
      // API will only be called when currency is changed in settings
      if (!cachedRates && !options?.forceRefresh) {
        // No cache available - show USD amount until currency is changed
        setConvertedAmount(amount);
        return;
      }

      // Only make API call if forceRefresh is true (when currency changes)
      if (options?.forceRefresh) {
        setLoading(true);
        try {
          const converted = await convertCurrency(amount, fromCurrency, toCurrency, { 
            roundForDisplay: true,
            forceRefresh: true
          });
          setConvertedAmount(converted);
          lastCurrencyRef.current = toCurrency;
        } catch (error) {
          console.error('Conversion error:', error);
          setConvertedAmount(amount);
        } finally {
          setLoading(false);
        }
      }
    };

    convert();

    // Listen for currency change events to refresh conversion
    const handleCurrencyChange = () => {
      // When currency changes, use the newly cached rate (no API call needed)
      let cachedRates: Record<string, number> | null = null;
      let rate: number | undefined;
      
      if (fromCurrency === 'USD' && toCurrency !== 'USD') {
        cachedRates = getCachedRatesFromStorage(toCurrency);
        if (cachedRates && cachedRates[toCurrency]) {
          rate = cachedRates[toCurrency];
        }
      } else if (toCurrency === 'USD' && fromCurrency !== 'USD') {
        cachedRates = getCachedRatesFromStorage(fromCurrency);
        if (cachedRates && cachedRates[fromCurrency]) {
          rate = cachedRates[fromCurrency];
        }
      }
      
      if (rate) {
        let converted: number;
        if (toCurrency === 'USD' && fromCurrency !== 'USD') {
          converted = amount / rate;
        } else if (fromCurrency === 'USD' && toCurrency !== 'USD') {
          converted = amount * rate;
        } else {
          converted = amount;
        }
        const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
        const precision = noDecimalsCurrencies.includes(toCurrency) ? 0 : 2;
        if (precision === 0) {
          setConvertedAmount(Math.round(converted + Number.EPSILON));
        } else {
          setConvertedAmount(parseFloat(converted.toFixed(precision)));
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('currencyChanged', handleCurrencyChange);
      return () => {
        window.removeEventListener('currencyChanged', handleCurrencyChange);
      };
    }
    */ // End of commented out conversion logic
  }, [amount, fromCurrency, toCurrency, options?.forceRefresh]);

  return { amount: convertedAmount, loading };
}

