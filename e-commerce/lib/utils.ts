import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(valueInCents: number) {
  return currencyFormatter.format(valueInCents / 100);
}

export function formatShortDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy');
}

export function getViewerLabel(name: string | null, email: string | null) {
  return name?.trim() || email?.trim() || 'Account';
}

export function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';
}
