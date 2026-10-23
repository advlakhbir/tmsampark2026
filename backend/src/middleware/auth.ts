import type { NextFunction, Request, Response } from 'express';
import { hasPermission, ROLE_PERMISSIONS, type Permission, type Role, type StaffRole } from '@tmsampark/shared';
import { Session, User } from '../models/index.js';
import { AppError, forbidden } from '../utils/errors.js';
import { hashToken, timingSafeEqual } from '../utils/tokens.js';

const STAFF: Role[] = ['super_admin', 'operations_manager', 'support_agent', 'content_editor'];

export function requireMatchingCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const header = req.get('x-csrf-token') || '';
  const cookie = (req.cookies?.tms_csrf as string | undefined) || '';
  if (!header || !cookie || !timingSafeEqual(header, cookie)) {
    next(new AppError(403, 'Invalid CSRF token', 'CSRF'));
    return;
  }
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.tms_session as string | undefined;
    if (!token) throw new AppError(401, 'Sign in to continue', 'UNAUTHENTICATED');
    const session = await Session.findOne({
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session) throw new AppError(401, 'Your session has ended. Sign in again.', 'UNAUTHENTICATED');
    const user = await User.findById(session.userId);
    if (!user || user.status !== 'active') throw new AppError(401, 'This account cannot sign in', 'UNAUTHENTICATED');
    const role = user.role as Role;
    req.sessionId = String(session._id);
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role,
      customerId: user.customerId ? String(user.customerId) : undefined,
      permissions: role === 'customer' ? [] : ROLE_PERMISSIONS[role as StaffRole],
    };
    const csrfHeader = req.get('x-csrf-token') || '';
    const csrfCookie = (req.cookies?.tms_csrf as string | undefined) || '';
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (!csrfHeader || !timingSafeEqual(csrfHeader, session.csrfToken) || !timingSafeEqual(csrfHeader, csrfCookie)) {
        throw new AppError(403, 'Invalid CSRF token', 'CSRF');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'Sign in to continue', 'UNAUTHENTICATED'));
    if (!STAFF.includes(req.user.role)) return next(forbidden());
    const allowed = permissions.every((permission) => hasPermission(req.user!.role, permission));
    if (!allowed) return next(forbidden());
    next();
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'Sign in to continue', 'UNAUTHENTICATED'));
    if (!STAFF.includes(req.user.role)) return next(forbidden());
    const allowed = permissions.some((permission) => hasPermission(req.user!.role, permission));
    if (!allowed) return next(forbidden());
    next();
  };
}

export function requireCustomer(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'customer' || !req.user.customerId) {
    next(forbidden('Customer sign-in is required'));
    return;
  }
  next();
}

export function assertSameCustomer(req: Request, customerId: unknown): void {
  if (!req.user) throw new AppError(401, 'Sign in to continue', 'UNAUTHENTICATED');
  if (req.user.role === 'customer' && String(customerId) !== req.user.customerId) {
    throw new AppError(404, 'Not found', 'NOT_FOUND');
  }
}
