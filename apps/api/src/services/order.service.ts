import { calculateTotals, type OrderStatus } from '@tmsampark/shared';
import type { Request } from 'express';
import { Application, Customer, Lead, Order, Service, ServicePackage, User } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import { referenceNumber } from '../utils/tokens.js';
import { writeAudit } from './audit.service.js';
import { notifyUser } from './notify.service.js';
import { getSettings } from './settings.service.js';

async function uniqueReference(): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const value = referenceNumber();
    const exists = await Order.exists({ referenceNumber: value });
    if (!exists) return value;
  }
  throw new AppError(500, 'Could not allocate a reference number', 'REFERENCE');
}

export async function createOrder(
  input: {
    customerId: string;
    leadId?: string;
    serviceId: string;
    packageId: string;
    addOnNames: string[];
    assignedTo?: string;
    estimatedCompletionDate?: string;
    internalNote?: string;
  },
  req: Request,
) {
  const customer = await Customer.findById(input.customerId);
  if (!customer) throw new AppError(404, 'Customer not found', 'NOT_FOUND');
  const service = await Service.findById(input.serviceId);
  if (!service || service.status === 'archived') throw new AppError(404, 'Service not found', 'NOT_FOUND');
  const pack = await ServicePackage.findOne({ _id: input.packageId, serviceId: service._id, active: true });
  if (!pack) throw new AppError(400, 'Choose an active package', 'PACKAGE');
  const selectedAddOns = (service.addOns || []).filter((item) => input.addOnNames.includes(item.name || ''));
  const addOnPaise = selectedAddOns.reduce((sum, item) => sum + (item.pricePaise || 0), 0);
  const settings = await getSettings();
  const totals = calculateTotals({
    professionalFeePaise: pack.professionalFeePaise,
    governmentFeePaise: pack.governmentFeePaise || 0,
    addOnPaise,
    gstRatePercent: settings.tax?.gstRatePercent ?? 18,
  });
  const reference = await uniqueReference();
  const order = await Order.create({
    referenceNumber: reference,
    customerId: customer._id,
    leadId: input.leadId || undefined,
    serviceId: service._id,
    serviceName: service.name,
    packageId: pack._id,
    packageName: pack.name,
    addOns: selectedAddOns.map((item) => ({ name: item.name, pricePaise: item.pricePaise })),
    status: 'pending_payment',
    assignedTo: input.assignedTo || undefined,
    estimatedCompletionDate: input.estimatedCompletionDate ? new Date(input.estimatedCompletionDate) : undefined,
    professionalFeePaise: pack.professionalFeePaise,
    governmentFeePaise: pack.governmentFeePaise || 0,
    addOnPaise,
    taxPaise: totals.taxPaise,
    totalPaise: totals.totalPaise,
    gstRatePercent: settings.tax?.gstRatePercent ?? 18,
    feeIsSample: Boolean(pack.feeIsSample || service.feeIsSample),
    internalNotes: input.internalNote ? [{ body: input.internalNote, authorId: req.user?.id, createdAt: new Date() }] : [],
    statusHistory: [{ status: 'pending_payment', note: 'Order created', at: new Date(), visibleToCustomer: true, actorId: req.user?.id }],
  });
  const application = await Application.create({
    referenceNumber: reference,
    orderId: order._id,
    customerId: customer._id,
    serviceName: service.name,
    status: 'pending_payment',
    estimatedCompletionDate: order.estimatedCompletionDate,
    timeline: [{ status: 'pending_payment', note: 'Application opened. Payment is still pending.', at: new Date(), visibleToCustomer: true }],
    checklist: (service.documents || []).map((doc) => ({
      label: doc.name || 'Document',
      status: 'requested',
    })),
  });
  if (input.leadId) {
    await Lead.findByIdAndUpdate(input.leadId, {
      status: 'converted',
      customerId: customer._id,
      $push: { activities: { type: 'converted', message: `Order ${reference} created`, at: new Date(), actorId: req.user?.id } },
    });
  }
  const user = await User.findOne({ customerId: customer._id });
  if (user) {
    await notifyUser({
      userId: String(user._id),
      title: `Application ${reference} created`,
      body: `${service.name} is ready in your account. The current status is pending payment.`,
      href: `/customer/orders/${order._id}`,
      email: true,
    });
  }
  await writeAudit(req, 'order.create', 'Order', order._id, { reference });
  return { order, application };
}

export async function updateOrderStatus(
  orderId: string,
  input: { status: OrderStatus; note?: string; customerVisible?: boolean },
  req: Request,
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  order.status = input.status;
  order.statusHistory.push({
    status: input.status,
    note: input.note || '',
    at: new Date(),
    visibleToCustomer: input.customerVisible !== false,
    actorId: req.user?.id as unknown as undefined,
  });
  await order.save();
  const application = await Application.findOne({ orderId: order._id });
  if (application) {
    application.status = input.status;
    application.timeline.push({
      status: input.status,
      note: input.note || '',
      at: new Date(),
      visibleToCustomer: input.customerVisible !== false,
    });
    await application.save();
  }
  const user = await User.findOne({ customerId: order.customerId });
  if (user && input.customerVisible !== false) {
    await notifyUser({
      userId: String(user._id),
      title: `Update on ${order.referenceNumber}`,
      body: input.note || `Status is now ${input.status.replaceAll('_', ' ')}.`,
      href: `/customer/orders/${order._id}`,
      email: true,
    });
  }
  await writeAudit(req, 'order.status', 'Order', order._id, { status: input.status });
  return order;
}
