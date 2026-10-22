import crypto from 'node:crypto';
import { env, isRazorpayConfigured } from '../config/env.js';
import { Invoice, Order, Payment, Refund, WebhookEvent } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import { invoiceNumber, timingSafeEqual } from '../utils/tokens.js';
import { writeAudit } from './audit.service.js';
import type { Request } from 'express';

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return timingSafeEqual(expected, signature);
}

export function verifyWebhookSignature(raw: Buffer, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
  return timingSafeEqual(expected, signature);
}

async function issueInvoice(paymentId: string) {
  const existing = await Invoice.findOne({ paymentId });
  if (existing) return existing;
  const payment = await Payment.findById(paymentId);
  if (!payment) return null;
  const order = await Order.findById(payment.orderId);
  if (!order) return null;
  return Invoice.create({
    number: invoiceNumber(),
    orderId: order._id,
    customerId: order.customerId,
    paymentId: payment._id,
    lineItems: [
      { description: `${order.serviceName} — ${order.packageName}`, amountPaise: order.professionalFeePaise },
      ...(order.addOnPaise ? [{ description: 'Add-ons', amountPaise: order.addOnPaise }] : []),
      ...(order.governmentFeePaise ? [{ description: 'Government fee (recorded)', amountPaise: order.governmentFeePaise }] : []),
      { description: 'GST on professional fees', amountPaise: order.taxPaise },
    ],
    subtotalPaise: order.professionalFeePaise + order.addOnPaise + order.governmentFeePaise,
    taxPaise: order.taxPaise,
    totalPaise: order.totalPaise,
    status: 'issued',
  });
}

export async function markCaptured(paymentId: string, providerPaymentId: string, verified: boolean) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
  if (payment.status === 'captured' || payment.status === 'refunded') {
    return { payment, duplicate: true };
  }
  payment.status = 'captured';
  payment.providerPaymentId = providerPaymentId;
  payment.signatureVerified = verified;
  payment.reconciliation = { ...payment.reconciliation, reconciled: verified, reference: providerPaymentId };
  await payment.save();
  const order = await Order.findById(payment.orderId);
  if (order && order.status === 'pending_payment') {
    order.status = 'payment_confirmed';
    order.statusHistory.push({
      status: 'payment_confirmed',
      note: 'Payment captured after signature verification',
      at: new Date(),
      visibleToCustomer: true,
    });
    await order.save();
    const { Application } = await import('../models/index.js');
    await Application.updateOne(
      { orderId: order._id },
      {
        status: 'payment_confirmed',
        $push: {
          timeline: {
            status: 'payment_confirmed',
            note: 'Payment confirmed',
            at: new Date(),
            visibleToCustomer: true,
          },
        },
      },
    );
  }
  await issueInvoice(String(payment._id));
  return { payment, duplicate: false };
}

export async function createCheckout(orderId: string, customerId: string) {
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  if (order.status !== 'pending_payment') throw new AppError(400, 'This order is not awaiting payment', 'PAYMENT_STATE');
  const payment = await Payment.create({
    orderId: order._id,
    customerId: order.customerId,
    provider: 'razorpay',
    amountPaise: order.totalPaise,
    taxPaise: order.taxPaise,
    professionalFeePaise: order.professionalFeePaise,
    governmentFeePaise: order.governmentFeePaise,
    status: 'created',
    idempotencyKey: `${order._id}:${Date.now()}`,
  });
  if (!isRazorpayConfigured) {
    return { configured: false, paymentId: String(payment._id), amountPaise: order.totalPaise, currency: 'INR' };
  }
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
    body: JSON.stringify({ amount: order.totalPaise, currency: 'INR', receipt: order.referenceNumber }),
  });
  if (!response.ok) {
    payment.status = 'failed';
    await payment.save();
    throw new AppError(502, 'The payment provider did not create an order', 'PROVIDER');
  }
  const data = (await response.json()) as { id: string };
  payment.providerOrderId = data.id;
  await payment.save();
  return {
    configured: true,
    paymentId: String(payment._id),
    keyId: env.RAZORPAY_KEY_ID,
    providerOrderId: data.id,
    amountPaise: order.totalPaise,
    currency: 'INR',
  };
}

export async function verifyCheckout(input: {
  paymentId: string;
  customerId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}) {
  const payment = await Payment.findOne({ _id: input.paymentId, customerId: input.customerId });
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
  if (payment.providerOrderId !== input.providerOrderId) throw new AppError(400, 'Payment reference mismatch', 'PAYMENT_MISMATCH');
  const valid = verifyPaymentSignature(input.providerOrderId, input.providerPaymentId, input.signature);
  if (!valid) throw new AppError(400, 'Payment signature could not be verified', 'SIGNATURE');
  return markCaptured(String(payment._id), input.providerPaymentId, true);
}

export async function recordManualPayment(input: { orderId: string; reference: string; notes?: string }, req: Request) {
  const order = await Order.findById(input.orderId);
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  const payment = await Payment.create({
    orderId: order._id,
    customerId: order.customerId,
    provider: 'manual',
    providerPaymentId: input.reference,
    amountPaise: order.totalPaise,
    taxPaise: order.taxPaise,
    professionalFeePaise: order.professionalFeePaise,
    governmentFeePaise: order.governmentFeePaise,
    status: 'created',
    reconciliation: { reconciled: true, reference: input.reference, notes: input.notes || '' },
  });
  await writeAudit(req, 'payment.manual', 'Payment', payment._id, { reference: input.reference });
  return markCaptured(String(payment._id), input.reference, true);
}

export async function handleRazorpayWebhook(raw: Buffer, signature: string, eventIdHeader?: string) {
  if (!verifyWebhookSignature(raw, signature)) throw new AppError(400, 'Invalid webhook signature', 'SIGNATURE');
  const event = JSON.parse(raw.toString('utf8')) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } };
  };
  const eventId = eventIdHeader || crypto.createHash('sha256').update(raw).digest('hex');
  try {
    await WebhookEvent.create({ provider: 'razorpay', eventId, type: event.event || '' });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code: number }).code === 11000) {
      return { duplicate: true };
    }
    throw error;
  }
  const entity = event.payload?.payment?.entity;
  if (event.event === 'payment.captured' && entity?.order_id && entity.id) {
    const payment = await Payment.findOne({ providerOrderId: entity.order_id });
    if (payment && entity.amount === payment.amountPaise) {
      await markCaptured(String(payment._id), entity.id, true);
    }
  }
  if (event.event === 'payment.failed' && entity?.order_id) {
    await Payment.updateOne({ providerOrderId: entity.order_id, status: 'created' }, { status: 'failed' });
  }
  return { duplicate: false };
}

export async function requestRefund(input: { paymentId: string; amountPaise: number; reason: string }, req: Request) {
  const payment = await Payment.findById(input.paymentId);
  if (!payment || payment.status !== 'captured') throw new AppError(400, 'Only a captured payment can be refunded', 'REFUND');
  if (input.amountPaise <= 0 || input.amountPaise > payment.amountPaise) {
    throw new AppError(400, 'Refund amount is outside the captured amount', 'REFUND');
  }
  const refund = await Refund.create({
    paymentId: payment._id,
    orderId: payment.orderId,
    customerId: payment.customerId,
    amountPaise: input.amountPaise,
    reason: input.reason,
    status: 'requested',
  });
  await writeAudit(req, 'refund.request', 'Refund', refund._id, { amountPaise: input.amountPaise });
  return refund;
}
