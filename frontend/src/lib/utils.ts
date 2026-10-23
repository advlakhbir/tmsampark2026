import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function digits(value: string): string {
  return value.replace(/\D/g, '');
}

export function whatsappLink(phone: string | undefined): string | null {
  const number = digits(phone || '');
  if (number.length < 10) return null;
  const withCountry = number.length === 10 ? `91${number}` : number;
  return `https://wa.me/${withCountry}`;
}

export function telLink(phone: string | undefined): string | null {
  const number = digits(phone || '');
  if (number.length < 10) return null;
  return `tel:+${number.length === 10 ? `91${number}` : number}`;
}
