import { z } from 'zod';
import { LEAD_SOURCES, ORDER_STATUSES, TICKET_PRIORITIES, TICKET_STATUSES } from './constants';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{8,18}$/, 'Enter a valid phone number');

export const utmSchema = z
  .object({
    source: z.string().max(120).optional(),
    medium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    term: z.string().max(120).optional(),
    content: z.string().max(120).optional(),
  })
  .partial();

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().email('Enter a valid email').max(160),
  phone: phoneSchema,
  message: z.string().trim().min(10, 'Please add a short note (at least 10 characters)').max(2000),
  source: z.enum(LEAD_SOURCES),
  serviceSlug: z.string().trim().max(120).optional().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm the privacy notice' }) }),
  companyWebsite: z.string().max(200).optional(),
  utm: utmSchema.optional(),
  landingPath: z.string().max(300).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: phoneSchema,
  password: z
    .string()
    .min(12, 'Use at least 12 characters')
    .regex(/[A-Za-z]/, 'Include a letter')
    .regex(/[0-9]/, 'Include a number'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm the privacy notice' }) }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(12)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z
    .string()
    .min(12)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export const leadUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  assignedTo: z.string().nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
  note: z.string().trim().max(2000).optional(),
});

export const orderCreateSchema = z.object({
  customerId: z.string().min(1),
  leadId: z.string().optional(),
  serviceId: z.string().min(1),
  packageId: z.string().min(1),
  addOnNames: z.array(z.string()).default([]),
  assignedTo: z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
  internalNote: z.string().max(2000).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(1000).optional(),
  customerVisible: z.boolean().default(true),
});

export const trackSchema = z.object({
  referenceNumber: z.string().trim().min(6).max(40),
  email: z.string().trim().email(),
});

export const ticketCreateSchema = z.object({
  subject: z.string().trim().min(4).max(140),
  category: z.string().trim().min(2).max(60),
  priority: z.enum(TICKET_PRIORITIES).default('normal'),
  message: z.string().trim().min(10).max(4000),
  orderId: z.string().optional(),
});

export const ticketReplySchema = z.object({
  body: z.string().trim().min(1).max(4000),
  visibility: z.enum(['internal', 'customer']).default('customer'),
  status: z.enum(TICKET_STATUSES).optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
