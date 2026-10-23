import { DEFAULT_NAV } from '@tmsampark/shared';

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';

export type PublicSettings = {
  brandName: string;
  tagline: string;
  contact: { email: string; phone: string; whatsapp: string; hours: string };
  social: { linkedin?: string; x?: string; facebook?: string; instagram?: string };
  announcement: { enabled: boolean; text: string; href: string };
  tax: { gstRatePercent: number; note: string };
  seo: { titleSuffix: string; defaultDescription: string };
  policies: { privacy: string; terms: string; refund: string; disclaimer: string; legallyReviewed: boolean };
  verifiedMetrics: { label: string; value: number; sourceNote: string }[];
  navigation: { href: string; label: string }[];
  address: string;
  organizationVerified: boolean;
  serviceDisclaimer: string;
};

export const fallbackSettings: PublicSettings = {
  brandName: 'TMSAMPARK',
  tagline: 'All In One Platform For Business Registration, Compliance, HR & Legal Tech',
  contact: { email: '', phone: '', whatsapp: '', hours: 'Monday to Friday, 10:00–18:00 IST' },
  social: {},
  announcement: {
    enabled: true,
    text: 'TMSAMPARK is a private services firm. We are not a government website.',
    href: '/disclaimer',
  },
  tax: { gstRatePercent: 18, note: 'GST is added to professional fees where applicable.' },
  seo: {
    titleSuffix: 'TMSAMPARK',
    defaultDescription:
      'TMSAMPARK helps Indian businesses prepare company, tax, licence, and compliance applications with a written scope and a trackable process.',
  },
  policies: {
    privacy: '',
    terms: '',
    refund: '',
    disclaimer: '',
    legallyReviewed: false,
  },
  verifiedMetrics: [],
  navigation: [...DEFAULT_NAV],
  address: '',
  organizationVerified: false,
  serviceDisclaimer:
    'This page is general information from a private services firm. It is not legal, tax, or government advice.',
};

export async function serverFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1${path}`, { next: { revalidate } });
    if (!response.ok) return null;
    const json = (await response.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export async function getSettings(): Promise<PublicSettings> {
  return (await serverFetch<PublicSettings>('/settings/public', 30)) || fallbackSettings;
}

export class ApiError extends Error {
  details?: { path: string; message: string }[];
  constructor(message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.details = details;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const method = (options.method || 'GET').toUpperCase();
  if (options.body && !(options.body instanceof FormData)) headers.set('content-type', 'application/json');
  if (method !== 'GET' && method !== 'HEAD') {
    const raw = document.cookie.split('; ').find((row) => row.startsWith('tms_csrf='));
    const token = raw ? decodeURIComponent(raw.split('=').slice(1).join('=')) : '';
    if (token) headers.set('x-csrf-token', token);
  }
  const response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'include' });
  const json = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: { message?: string; details?: { path: string; message: string }[] };
  };
  if (!response.ok) throw new ApiError(json.error?.message || 'Request failed', json.error?.details);
  return json.data as T;
}

export async function ensureCsrf(): Promise<void> {
  if (document.cookie.includes('tms_csrf=')) return;
  await fetch('/api/v1/auth/csrf', { credentials: 'include' });
}
