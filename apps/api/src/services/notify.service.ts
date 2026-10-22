import nodemailer from 'nodemailer';
import { env, isEmailConfigured, isSmsConfigured } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Notification, User } from '../models/index.js';

export async function sendEmail(to: string, subject: string, text: string): Promise<{ sent: boolean; reason: string }> {
  if (!isEmailConfigured) return { sent: false, reason: 'email_not_configured' };
  try {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
    return { sent: true, reason: 'sent' };
  } catch (error) {
    logger.error({ err: error }, 'email delivery failed');
    return { sent: false, reason: 'email_failed' };
  }
}

export async function sendSms(to: string, body: string): Promise<{ sent: boolean; reason: string }> {
  if (!isSmsConfigured) return { sent: false, reason: 'sms_not_configured' };
  try {
    const response = await fetch(env.SMS_PROVIDER, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.SMS_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ to, sender: env.SMS_SENDER_ID, body }),
    });
    if (!response.ok) return { sent: false, reason: 'sms_failed' };
    return { sent: true, reason: 'sent' };
  } catch (error) {
    logger.error({ err: error }, 'sms delivery failed');
    return { sent: false, reason: 'sms_failed' };
  }
}

export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  email?: boolean;
}): Promise<void> {
  const user = await User.findById(input.userId);
  let delivery: 'stored' | 'sent' | 'skipped' | 'failed' = 'stored';
  let deliveryReason = '';
  if (input.email && user) {
    const result = await sendEmail(user.email, input.title, input.body);
    delivery = result.sent ? 'sent' : result.reason === 'email_not_configured' ? 'skipped' : 'failed';
    deliveryReason = result.reason;
  }
  await Notification.create({
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href || '',
    channel: 'in_app',
    delivery,
    deliveryReason,
  });
}
