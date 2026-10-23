import type { Request, Response } from 'express';
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '@tmsampark/shared';
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/async.js';
import { randomToken } from '../utils/tokens.js';
import { cookieBase, changePassword, clearAuthCookies, createStaff, login, logout, publicUser, registerCustomer, requestPasswordReset, resetPassword } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';
import { z } from 'zod';
import { STAFF_ROLES } from '@tmsampark/shared';

export const csrf = asyncHandler(async (_req, res) => {
  const token = randomToken(24);
  res.cookie('tms_csrf', token, { ...cookieBase(), httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ data: { token } });
});

export const register = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerCustomer(input);
  const sessionUser = await login(input.email, input.password, req, res);
  res.status(201).json({ data: sessionUser || publicUser(user) });
});

export const signIn = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await login(input.email, input.password, req, res);
  res.json({ data: user });
});

export const signOut = asyncHandler(async (req, res) => {
  await logout(req, res);
  res.json({ data: { ok: true } });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(401, 'Sign in to continue', 'UNAUTHENTICATED');
  res.json({ data: publicUser(user) });
});

export const forgot = asyncHandler(async (req, res) => {
  const input = forgotPasswordSchema.parse(req.body);
  const result = await requestPasswordReset(input.email);
  res.json({
    data: {
      ok: true,
      delivered: result.delivered,
      reason: result.delivered ? 'sent' : result.reason === 'accepted' ? 'accepted' : result.reason,
      ...(result.devToken ? { devToken: result.devToken } : {}),
    },
  });
});

export const reset = asyncHandler(async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input.token, input.password);
  res.json({ data: { ok: true } });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  await changePassword(req.user!.id, input.currentPassword, input.newPassword);
  clearAuthCookies(res);
  res.json({ data: { ok: true } });
});

const staffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(12).regex(/[A-Za-z]/).regex(/[0-9]/),
  role: z.enum(STAFF_ROLES),
});

export const postStaff = asyncHandler(async (req: Request, res: Response) => {
  const input = staffSchema.parse(req.body);
  const user = await createStaff(input, req);
  res.status(201).json({ data: user });
});
