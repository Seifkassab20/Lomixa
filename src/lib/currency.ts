export type CountryCode = 'sa' | 'uae' | 'egypt' | 'kw' | 'qa' | 'om' | 'bh' | 'jo' | 'iq' | 'ly';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  usdRate: number; // 1 USD = ? Local
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  sa: { code: 'SAR', symbol: 'SR', usdRate: 3.75 },
  uae: { code: 'AED', symbol: 'DH', usdRate: 3.67 },
  egypt: { code: 'EGP', symbol: 'E£', usdRate: 52.0 }, // Requested: 1$ = 52 EGP
  kw: { code: 'KWD', symbol: 'KD', usdRate: 0.31 },
  qa: { code: 'QAR', symbol: 'QR', usdRate: 3.64 },
  om: { code: 'OMR', symbol: 'OR', usdRate: 0.38 },
  bh: { code: 'BHD', symbol: 'BD', usdRate: 0.38 },
  jo: { code: 'JOD', symbol: 'JD', usdRate: 0.71 },
  iq: { code: 'IQD', symbol: 'ID', usdRate: 1310.0 },
  ly: { code: 'LYD', symbol: 'LD', usdRate: 4.80 },
};

export const DEFAULT_CURRENCY = CURRENCIES.sa;

/**
 * Formats a numeric value as a local currency string
 */
export function formatCurrency(amount: number, countryCode?: string): string {
  const currency = CURRENCIES[countryCode || 'sa'] || DEFAULT_CURRENCY;
  return `${amount.toLocaleString()} ${currency.code}`;
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
  return CURRENCIES[countryCode || 'sa'] || DEFAULT_CURRENCY;
}
