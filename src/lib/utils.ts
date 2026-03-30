import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '$') {
  return new Intl.NumberFormat(currency === '₹' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: currency === '₹' ? 'INR' : 'USD',
  }).format(amount);
}
