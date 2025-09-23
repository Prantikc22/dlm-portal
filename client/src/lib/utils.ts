import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency preference utilities
const CURRENCY_STORAGE_KEY = 'lw_currency';

export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export function getPreferredCurrency(): SupportedCurrency {
  const val = (typeof window !== 'undefined' && window.localStorage.getItem(CURRENCY_STORAGE_KEY)) || 'INR';
  if (val === 'USD' || val === 'EUR' || val === 'GBP' || val === 'INR') return val;
  return 'INR';
}

export function setPreferredCurrency(cur: SupportedCurrency) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, cur);
  }
}

function localeForCurrency(cur: SupportedCurrency): string {
  switch (cur) {
    case 'INR': return 'en-IN';
    case 'USD': return 'en-US';
    case 'EUR': return 'de-DE';
    case 'GBP': return 'en-GB';
    default: return 'en-IN';
  }
}

// Shared currency formatter - respects user-selected currency
export function formatCurrency(amount: string | number, overrideCurrency?: SupportedCurrency): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0';
  const currency = overrideCurrency || getPreferredCurrency();
  try {
    const fmt = new Intl.NumberFormat(localeForCurrency(currency), { style: 'currency', currency });
    return fmt.format(numAmount);
  } catch {
    // Fallback simple formatting
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
    return `${symbol}${numAmount.toLocaleString(localeForCurrency('INR'))}`;
  }
}
