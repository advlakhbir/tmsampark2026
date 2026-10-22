import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { STAFF_ROLES, type Role } from '@tmsampark/shared';
import { env } from '../config/env.js';
import { Customer, Session, User } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import { hashToken, randomToken } from '../utils/tokens.js';
import { sendEmail } from './notify.service.js';
import { writeAudit } from './audit.service.js';

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function rounds(): number {
  return env.NODE_ENV === 'test' ? 4 : 12;
}

export function cookieBase() {
  const secure = env.COOKIE_SECURE || env.NODE_ENV === 'production';
  return { secure, sameSite: 'lax' as const, path: '/' };
}

export function setAuthCookies(res: Response, sessionToken: string, csrfToken: string): void {
  const base = cookieBase();
  res.cookie('tms_session', sessionToken, { ...base, httpOnly: true, maxAge: SESSION_MS });
  res.cookie('tms_csrf', csrfToken, { ...base, httpOnly: false, maxAge: SESSION_MS });
}

export function clearAuthCookies(res: Response): void {
  const base = cookieBase();
  res.clearCookie('tms_session', { ...base, httpOnly: true });
  res.clearCookie('tms_csrf', { ...base, httpOnly: false });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, rounds());
}

async function openSession(userId: string, req: Request) {
  const sessionToken = randomToken();
  const csrfToken = randomToken(24);
  await Session.create({
    userId,
    tokenHash: hashToken(sessionToken),
    csrfToken,
    expiresAt: new Date(Date.now() + SESSION_MS),
    userAgent: req.get('user-agent') || '',
    ip: req.ip || '',
  });
  return { sessionToken, csrfToken };
}

export async function registerCustomer(input: { name: string; email: string; phone: string; password: string }) {
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, 'An account with this email already exists', 'EMAIL_IN_USE');
  const customer = await Customer.create({ name: input.name, email, phone: input.phone, status: 'active' });
  const user = await User.create({
    name: input.name,
    email,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    role: 'customer',
    status: 'active',
    customerId: customer._id,
  });
  customer.userId = user._id;
  await customer.save();
  return user;
}

export async function login(email: string, password: string, req: Request, res: Response) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new AppError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  if (user.status !== 'active') throw new AppError(403, 'This account is not active', 'ACCOUNT_INACTIVE');
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(429, 'Too many attempts. Try again later.', 'LOCKED');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedLogins += 1;
    if (user.failedLogins >= 8) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      user.failedLogins = 0;
    }
    await user.save();
    throw new AppError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  }
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  const session = await openSession(String(user._id), req);
  setAuthCookies(res, session.sessionToken, session.csrfToken);
  return publicUser(user);
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.tms_session as string | undefined;
  if (token) {
    await Session.updateOne({ tokenHash: hashToken(token) }, { revokedAt: new Date() });
  }
  clearAuthCookies(res);
}

export function publicUser(user: { _id: unknown; email: string; name: string; role: string; phone?: string; customerId?: unknown; mustChangePassword?: boolean }) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role as Role,
    phone: user.phone || '',
    customerId: user.customerId ? String(user.customerId) : undefined,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return { delivered: false, reason: 'accepted' };
  const token = randomToken();
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const emailResult = await sendEmail(user.email, 'Reset your TMSAMPARK password', `Use this link within one hour:\n${link}\n\nIf you did not ask for this, ignore the email.`);
  return {
    delivered: emailResult.sent,
    reason: emailResult.sent ? 'sent' : emailResult.reason,
    devToken: env.NODE_ENV === 'development' && !emailResult.sent ? token : undefined,
  };
}

export async function resetPassword(token: string, password: string) {
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash');
  if (!user) throw new AppError(400, 'This reset link is invalid or expired', 'RESET_INVALID');
  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError(401, 'Sign in to continue', 'UNAUTHENTICATED');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new AppError(400, 'Current password is incorrect', 'INVALID_PASSWORD');
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
}

export function assertStaffRole(role: string): asserts role is (typeof STAFF_ROLES)[number] {
  if (!STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    throw new AppError(400, 'Choose a staff role', 'INVALID_ROLE');
  }
}

export async function createStaff(input: { name: string; email: string; password: string; role: string }, req: Request) {
  assertStaffRole(input.role);
  const email = input.email.toLowerCase();
  if (await User.findOne({ email })) throw new AppError(409, 'An account with this email already exists', 'EMAIL_IN_USE');
  const user = await User.create({
    name: input.name,
    email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    status: 'active',
    mustChangePassword: true,
  });
  await writeAudit(req, 'staff.create', 'User', user._id, { role: input.role, email });
  return publicUser(user);
}
