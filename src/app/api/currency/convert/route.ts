import { NextRequest, NextResponse } from 'next/server';

// Currency conversion API using ExchangeRate-API (free tier)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';

// In-memory cache for exchange rates
interface CacheEntry {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds - rates don't change frequently

function getCacheKey(baseCurrency: string): string {
  return `rates_${baseCurrency}`;
}

function getCachedRates(baseCurrency: string): Record<string, number> | null {
  const cacheKey = getCacheKey(baseCurrency);
  const entry = cache.get(cacheKey);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  // Check if cache is still valid (less than 1 hour old)
  if (age < CACHE_DURATION) {
    return entry.rates;
  }

  // Cache expired, remove it
  cache.delete(cacheKey);
  return null;
}

function setCachedRates(baseCurrency: string, rates: Record<string, number>): void {
  const cacheKey = getCacheKey(baseCurrency);
  cache.set(cacheKey, {
    rates,
    timestamp: Date.now(),
    baseCurrency,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'USD';
    const amount = parseFloat(searchParams.get('amount') || '1');
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (from === to) {
      return NextResponse.json({ convertedAmount: amount, rate: 1 });
    }

    // Always use USD as base currency (most APIs only support major currencies as base)
    // For conversions from/to non-USD currencies, we'll use USD as intermediary
    let baseCurrency = 'USD';
    let sourceAmount = amount;
    let fromRates: Record<string, number> | null = null;
    
    // If converting from a non-USD currency, first convert to USD
    if (from !== 'USD') {
      fromRates = forceRefresh ? null : getCachedRates('USD');
      
      if (!fromRates) {
        const response = await fetch(`${EXCHANGE_RATE_API}/USD`, {
          cache: 'no-store',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();
        fromRates = data.rates;
        if (fromRates) {
          setCachedRates('USD', fromRates);
        }
      }

      if (!fromRates) {
        throw new Error('Failed to fetch USD base rates');
      }

      if (!fromRates[from]) {
        throw new Error(`Unsupported currency: ${from}`);
      }

      // Convert from source currency to USD first
      // Rate is how many source currency units per USD, so divide
      const usdRate = fromRates[from];
      sourceAmount = amount / usdRate;
      baseCurrency = 'USD';
    }

    // Now convert from USD to target currency
    let rates = forceRefresh ? null : getCachedRates('USD');

    if (!rates) {
      // Cache miss or expired - fetch from API
      const response = await fetch(`${EXCHANGE_RATE_API}/USD`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      rates = data.rates;
      
      // Store in cache
      setCachedRates('USD', data.rates);
    }

    if (!rates) {
      throw new Error('Failed to get exchange rates');
    }

    let rate: number;
    if (to === 'USD') {
      // Already in USD
      rate = 1;
    } else {
      rate = rates[to];
      if (!rate) {
        return NextResponse.json(
          { error: `Invalid currency code: ${to}` },
          { status: 400 }
        );
      }
    }

    // Convert: sourceAmount (in USD) * rate (target currency per USD)
    let convertedAmount = sourceAmount * rate;
    
    // Determine the rate to return based on conversion direction
    // This rate will be stored in cache for accurate round-trip conversions
    let returnedRate = rate;
    
    // Get rates again if we need them for returning the correct rate
    if (to === 'USD' && from !== 'USD') {
      // When converting PKR -> USD:
      // - We get rate as "PKR per USD" (e.g., 283.5) from the API
      // - We divide: 65000 / 283.5 = 229.45 USD
      // - To convert back USD -> PKR, we need the same rate: 229.45 * 283.5 = 65000
      // - So we return the original rate (PKR per USD) for USD->PKR conversions
      // We need to get the rate from the rates we fetched earlier
      // Use the rates we already have (fromRates or rates)
      const ratesForReturn = fromRates || rates;
      if (ratesForReturn && ratesForReturn[from]) {
        returnedRate = ratesForReturn[from]; // This is the exact rate used for the conversion
      }
    } else if (from === 'USD' && to !== 'USD') {
      // When converting USD -> PKR:
      // - Rate is already "PKR per USD" (e.g., 283.5)
      // - We multiply: 229.45 * 283.5 = 65000 PKR
      // - So we return the rate as-is
      returnedRate = rate;
    }

    // Use maximum precision (15 decimal places) for conversions to avoid rounding errors
    // This ensures accuracy when converting back and forth
    // For very large numbers (like PKR), we need extra precision
    return NextResponse.json({
      convertedAmount: parseFloat(convertedAmount.toFixed(15)),
      rate: parseFloat(returnedRate.toFixed(15)), // Store rate with very high precision
      from,
      to,
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}

