import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '$') {
  const currencyMap: { [key: string]: string } = {
    '₹': 'INR',
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP'
  };
  
  const currencyCode = currencyMap[currency] || 'USD';
  const locale = currency === '₹' ? 'en-IN' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
