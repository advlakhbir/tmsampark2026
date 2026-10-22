import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/tmsampark'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  SESSION_SECRET: z.string().min(16).default('dev-only-session-secret-change-me'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().default('TMSAMPARK <noreply@example.com>'),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default('./storage'),
  S3_BUCKET: z.string().optional().default(''),
  S3_REGION: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  S3_ENDPOINT: z.string().optional().default(''),
  MALWARE_SCAN_URL: z.string().optional().default(''),
  MALWARE_SCAN_TOKEN: z.string().optional().default(''),
  SMS_PROVIDER: z.string().optional().default(''),
  SMS_API_KEY: z.string().optional().default(''),
  SMS_SENDER_ID: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.message}`);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (env.SESSION_SECRET.includes('dev-only') || env.SESSION_SECRET.length < 32) {
    throw new Error('Set a strong SESSION_SECRET before starting in production.');
  }
  if (!env.MONGODB_URI || env.MONGODB_URI.includes('example')) {
    throw new Error('Set MONGODB_URI before starting in production.');
  }
}

export const corsOrigins = env.CORS_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean);

export const isEmailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
export const isRazorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
export const isSmsConfigured = Boolean(env.SMS_PROVIDER && env.SMS_API_KEY);
export const isS3Configured = Boolean(env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
