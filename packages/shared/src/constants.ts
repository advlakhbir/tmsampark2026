export const BRAND = {
  name: 'TMSAMPARK',
  legalName: 'TMSAMPARK',
  tagline: 'Business registrations and compliance, with a clear process.',
} as const;

export const ROLES = [
  'super_admin',
  'operations_manager',
  'support_agent',
  'content_editor',
  'customer',
] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = [
  'super_admin',
  'operations_manager',
  'support_agent',
  'content_editor',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  'leads:read',
  'leads:write',
  'leads:assign',
  'leads:export',
  'orders:read',
  'orders:write',
  'customers:read',
  'customers:write',
  'payments:read',
  'payments:write',
  'documents:read',
  'documents:write',
  'tickets:read',
  'tickets:write',
  'reports:read',
  'reports:export',
  'services:read',
  'services:write',
  'content:read',
  'content:write',
  'settings:read',
  'settings:write',
  'staff:read',
  'staff:write',
  'audit:read',
  'notifications:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[] | ['*']> = {
  super_admin: ['*'],
  operations_manager: [
    'leads:read',
    'leads:write',
    'leads:assign',
    'leads:export',
    'orders:read',
    'orders:write',
    'customers:read',
    'customers:write',
    'payments:read',
    'payments:write',
    'documents:read',
    'documents:write',
    'tickets:read',
    'tickets:write',
    'reports:read',
    'reports:export',
    'services:read',
    'notifications:read',
  ],
  support_agent: [
    'leads:read',
    'leads:write',
    'leads:assign',
    'tickets:read',
    'tickets:write',
    'customers:read',
    'orders:read',
    'documents:read',
    'notifications:read',
  ],
  content_editor: [
    'content:read',
    'content:write',
    'services:read',
    'services:write',
    'notifications:read',
  ],
};

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ['contact', 'consultation', 'service_enquiry', 'apply_now'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const ORDER_STATUSES = [
  'pending_payment',
  'payment_confirmed',
  'documents_pending',
  'under_review',
  'processing',
  'completed',
  'on_hold',
  'cancelled',
  'rejected',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['created', 'authorized', 'captured', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DOCUMENT_STATUSES = ['requested', 'received', 'approved', 'rejected'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export const PUBLISH_STATUSES = ['draft', 'published', 'archived'] as const;
export const BLOG_STATUSES = ['draft', 'scheduled', 'published'] as const;

export const SERVICE_DISCLAIMER =
  'This page is general information from a private services firm. It is not legal, tax, or government advice, and it is not an official government portal. Fees, forms, and timelines are set by the relevant authority and can change. Confirm the current requirement before you apply.';

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === 'customer') return false;
  const granted = ROLE_PERMISSIONS[role];
  if (!granted) return false;
  if (granted[0] === '*') return true;
  return (granted as Permission[]).includes(permission);
}

export function formatInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function calculateTotals(input: {
  professionalFeePaise: number;
  governmentFeePaise: number;
  addOnPaise: number;
  gstRatePercent: number;
}): { taxablePaise: number; taxPaise: number; totalPaise: number } {
  const taxablePaise = input.professionalFeePaise + input.addOnPaise;
  const taxPaise = Math.round((taxablePaise * input.gstRatePercent) / 100);
  const totalPaise = taxablePaise + input.governmentFeePaise + taxPaise;
  return { taxablePaise, taxPaise, totalPaise };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const DEFAULT_NAV = [
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blogs', label: 'Guides' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  payment_confirmed: 'Payment confirmed',
  documents_pending: 'Documents pending',
  under_review: 'Under review',
  processing: 'Processing',
  completed: 'Completed',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
};
