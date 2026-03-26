export type CountryCode = 'sa' | 'uae' | 'egypt' | 'kw' | 'qa' | 'om' | 'bh' | 'jo' | 'iq' | 'ly' | 'eg';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  usdRate: number; // 1 USD = ? Local
}

// Global mutable state for rates, initialized with realistic defaults
export const CURRENCIES: Record<string, CurrencyInfo> = {
  sa: { code: 'SAR', symbol: 'SR', usdRate: 3.75 },
  uae: { code: 'AED', symbol: 'DH', usdRate: 3.67 },
  egypt: { code: 'EGP', symbol: 'E£', usdRate: 52.0 }, 
  eg: { code: 'EGP', symbol: 'E£', usdRate: 52.0 },
  kw: { code: 'KWD', symbol: 'KD', usdRate: 0.31 },
  qa: { code: 'QAR', symbol: 'QR', usdRate: 3.64 },
  om: { code: 'OMR', symbol: 'OR', usdRate: 0.38 },
  bh: { code: 'BHD', symbol: 'BD', usdRate: 0.38 },
  jo: { code: 'JOD', symbol: 'JD', usdRate: 0.71 },
  iq: { code: 'IQD', symbol: 'ID', usdRate: 1310.0 },
  ly: { code: 'LYD', symbol: 'LD', usdRate: 4.80 },
};

const CACHE_KEY = 'lomixa_currency_rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Initializes and refreshes currency rates from a real-time API
 */
export async function initializeRates() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        updateLocalRates(rates);
        return;
      }
    }

    // Fetch from Free Open Exchange Rates API
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    
    if (data && data.rates) {
      updateLocalRates(data.rates);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: data.rates,
        timestamp: Date.now()
      }));
    }
  } catch (error) {
    console.warn('Real-time currency fetch failed, using fallback rates:', error);
  }
}

function updateLocalRates(newRates: any) {
  Object.keys(CURRENCIES).forEach(key => {
    const code = CURRENCIES[key].code;
    if (newRates[code]) {
      CURRENCIES[key].usdRate = newRates[code];
    }
  });
}

export const DEFAULT_CURRENCY = CURRENCIES.sa;

/**
 * Formats a numeric value as a local currency string
 */
export function formatCurrency(amount: number, countryCode?: string): string {
  const code = (countryCode || 'sa').toLowerCase();
  const currency = CURRENCIES[code] || CURRENCIES.sa;
  
  // Format using Latin numerals (0-9) by forcing the 'latn' numbering system
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Converts an amount from one currency to another via USD base
 */
export function convertCurrency(amount: number, from: CountryCode, to: CountryCode): number {
  if (from === to) return amount;
  const fromInfo = CURRENCIES[from] || DEFAULT_CURRENCY;
  const toInfo = CURRENCIES[to] || DEFAULT_CURRENCY;
  
  const inUSD = amount / fromInfo.usdRate;
  return Math.round(inUSD * toInfo.usdRate);
}

/**
 * Gets the localized currency info for a country
 */
export function getCurrencyInfo(countryCode?: string): CurrencyInfo {
  const code = (countryCode || 'sa').toLowerCase();
  return CURRENCIES[code] || CURRENCIES.sa;
}
