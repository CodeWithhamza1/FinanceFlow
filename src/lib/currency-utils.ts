import api from './api';

// Client-side cache for exchange rates (persists across page loads)
interface ClientRateCache {
  rates: Record<string, number>; // Key: currency code, Value: rate (currency per USD)
  timestamp: number;
  currency: string; // The currency this cache is for (target currency for USD->target conversions)
}

const CLIENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY = 'currency_rates_cache';

// Get cached rates from localStorage
export function getCachedRatesFromStorage(currency: string): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cache: ClientRateCache = JSON.parse(cached);
    const now = Date.now();
    const age = now - cache.timestamp;
    
    // Check if cache is valid and matches current currency
    if (age < CLIENT_CACHE_DURATION && cache.currency === currency && cache.rates) {
      return cache.rates;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Store rates in localStorage with high precision
export function setCachedRatesToStorage(rates: Record<string, number>, currency: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Store rates with high precision to avoid rounding errors
    const cache: ClientRateCache = {
      rates: Object.fromEntries(
        // Store rates with maximum precision - don't round to preserve exact values
        Object.entries(rates).map(([key, value]) => {
          console.log(`[Cache] Storing rate for ${key}: ${value}`);
          return [key, value];
        })
      ),
      timestamp: Date.now(),
      currency,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Ignore localStorage errors
  }
}

// Clear currency cache (call when currency preference changes)
export function clearCurrencyCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    // Ignore errors
  }
}

// Format currency amount with proper symbol (amount should already be converted)
export function formatCurrency(amount: number, currency: string): string {
  try {
    // Currencies that typically don't use decimals
    const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
    const minimumFractionDigits = noDecimalsCurrencies.includes(currency) ? 0 : 2;
    const maximumFractionDigits = noDecimalsCurrencies.includes(currency) ? 0 : 2;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    const symbol = getCurrencySymbol(currency);
    const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
    const decimals = noDecimalsCurrencies.includes(currency) ? 0 : 2;
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}

// Get currency symbol
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    PKR: '₨',
  };
  return symbols[currency] || currency;
}

// Format amount with dynamic currency symbol but keep amount static (no conversion)
// Used for displaying USD amounts with user's selected currency symbol
export function formatCurrencyStatic(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
  const decimals = noDecimalsCurrencies.includes(currency) ? 0 : 2;
  const formattedAmount = amount.toFixed(decimals);
  
  // Add thousand separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${symbol}${parts.join('.')}`;
}

// Convert amount from one currency to another
// When saving: preserve full precision (don't round USD)
// When displaying: round based on target currency
// Uses client-side cache to minimize API calls - only fetches when cache is missing/invalid
export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  options?: { roundForDisplay?: boolean; forceRefresh?: boolean }
): Promise<number> {
  // CONVERSION DISABLED - Return amount as-is
  return amount;
  
  /* COMMENTED OUT - CONVERSION LOGIC
  if (fromCurrency === toCurrency) return amount;
  
  try {
    // Check client cache first for both directions
    if (!options?.forceRefresh) {
      // For conversions FROM USD (most common - displaying data)
      if (fromCurrency === 'USD') {
        const cachedRates = getCachedRatesFromStorage(toCurrency);
        if (cachedRates && cachedRates[toCurrency]) {
          // Use cached rate - no API call needed!
          const rate = cachedRates[toCurrency];
          const convertedAmount = amount * rate;
          console.log(`[Convert] ${amount} USD * ${rate} = ${convertedAmount} ${toCurrency}`);
          
          // Round based on target currency
          const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
          const precision = noDecimalsCurrencies.includes(toCurrency) ? 0 : 2;
          if (precision === 0) {
            // Use proper rounding for whole number currencies
            // Round to nearest integer to avoid 64,999 or 65,001 issues
            const rounded = Math.round(convertedAmount);
            console.log(`[Convert] Rounded ${convertedAmount} -> ${rounded}`);
            return rounded;
          }
          return parseFloat(convertedAmount.toFixed(precision));
        }
      }
      // For conversions TO USD (when saving data)
      else if (toCurrency === 'USD') {
        const cachedRates = getCachedRatesFromStorage(fromCurrency);
        if (cachedRates && cachedRates[fromCurrency]) {
          // Use cached rate - no API call needed!
          // The rate is stored as "fromCurrency per USD" (e.g., PKR per USD)
          // So to convert PKR->USD: amount / rate
          const rate = cachedRates[fromCurrency];
          const convertedAmount = amount / rate;
          console.log(`[Convert] ${amount} ${fromCurrency} / ${rate} = ${convertedAmount} USD`);
          
          // Keep MAXIMUM precision when converting to USD for storage
          // Don't round at all to preserve exact value for round-trip conversions
          return convertedAmount;
        }
      }
    }
    
    // Cache miss - need API call
    const response = await api.get(`/api/currency/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}&refresh=${options?.forceRefresh ? 'true' : 'false'}`);
    
    // Update client cache based on conversion direction
    // The API returns the rate as "target currency per USD" (e.g., PKR per USD)
    if (response.data.rate) {
      if (fromCurrency === 'USD') {
        // When converting USD->PKR: store rate keyed by PKR
        // This rate will be used for both USD->PKR and PKR->USD conversions
        const cachedRates = getCachedRatesFromStorage(toCurrency) || {};
        const newRates: Record<string, number> = { ...cachedRates, [toCurrency]: response.data.rate };
        setCachedRatesToStorage(newRates, toCurrency);
      } else if (toCurrency === 'USD' && fromCurrency !== 'USD') {
        // When converting PKR->USD: store rate keyed by PKR
        // This SAME rate will be used for USD->PKR conversions (amount * rate)
        // and for PKR->USD conversions (amount / rate)
        // CRITICAL: Store the EXACT rate with maximum precision
        setCachedRatesToStorage({ [fromCurrency]: response.data.rate }, fromCurrency);
      }
    }
    
    // If converting TO USD (for storage), keep full precision - don't round
    if (toCurrency === 'USD' && !options?.roundForDisplay) {
      // Return with maximum precision to avoid any rounding loss
      // This is the exact USD amount that will be stored in the database
      // Don't use toFixed - return the raw number to preserve maximum precision
      return response.data.convertedAmount;
    }
    
    // If converting FROM USD (for display), round based on target currency
    // For currencies without decimals, round to whole number using Math.round for accuracy
    const noDecimalsCurrencies = ['JPY', 'PKR', 'KRW', 'VND', 'IDR'];
    const precision = noDecimalsCurrencies.includes(toCurrency) ? 0 : 2;
    
    let result = response.data.convertedAmount;
    
    // For whole number currencies, use Math.round to avoid floating point errors
    if (precision === 0) {
      // Use proper rounding for whole numbers
      return Math.round(result);
    }
    
    return parseFloat(result.toFixed(precision));
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount; // Fallback to original amount
  }
  */
}

// Convert amount from USD to target currency (backward compatibility)
export async function convertFromUSD(amount: number, targetCurrency: string): Promise<number> {
  return convertCurrency(amount, 'USD', targetCurrency);
}

