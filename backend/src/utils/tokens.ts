import crypto from 'node:crypto';

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function referenceNumber(): string {
  const year = new Date().getFullYear();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  const bytes = crypto.randomBytes(6);
  for (const byte of bytes) body += alphabet[byte % alphabet.length];
  return `TMS-${year}-${body}`;
}

export function invoiceNumber(): string {
  const year = new Date().getFullYear();
  const n = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${year}-${n}`;
}
