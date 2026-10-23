import { profileSchema, ticketCreateSchema, ticketReplySchema } from '@tmsampark/shared';
import { z } from 'zod';
import {
  Application,
  Customer,
  DocumentFile,
  Invoice,
  Lead,
  Notification,
  Order,
  Payment,
  Refund,
  SupportTicket,
  User,
} from '../models/index.js';
import { assertSameCustomer } from '../middleware/auth.js';
import { writeAudit } from '../services/audit.service.js';
import { createCheckout, verifyCheckout } from '../services/payment.service.js';
import { readFile, saveFile, scanBuffer, signedDownload } from '../services/storage.service.js';
import { asyncHandler } from '../utils/async.js';
import { AppError, notFound } from '../utils/errors.js';

export const customerProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user!.customerId);
  if (!customer) throw notFound();
  res.json({ data: customer });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const input = profileSchema.parse(req.body);
  const customer = await Customer.findByIdAndUpdate(req.user!.customerId, { name: input.name, phone: input.phone }, { new: true });
  await User.findByIdAndUpdate(req.user!.id, { name: input.name, phone: input.phone });
  res.json({ data: customer });
});

export const myEnquiries = asyncHandler(async (req, res) => {
  const leads = await Lead.find({ email: req.user!.email }).sort({ createdAt: -1 }).select('-ip -notes').lean();
  res.json({ data: leads });
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user!.customerId }).sort({ createdAt: -1 }).lean();
  res.json({ data: orders });
});

export const myOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user!.customerId }).lean();
  if (!order) throw notFound();
  const application = await Application.findOne({ orderId: order._id }).lean();
  const payments = await Payment.find({ orderId: order._id }).lean();
  const invoices = await Invoice.find({ orderId: order._id }).lean();
  res.json({
    data: {
      order,
      application: application
        ? { ...application, timeline: application.timeline.filter((item) => item.visibleToCustomer) }
        : null,
      payments,
      invoices,
    },
  });
});

export const myDocuments = asyncHandler(async (req, res) => {
  const docs = await DocumentFile.find({ customerId: req.user!.customerId, archived: false })
    .select('-storageKey')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ data: docs });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'Choose a file', 'FILE');
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user!.customerId });
  if (!order) throw notFound();
  const scanStatus = await scanBuffer(req.file.buffer, req.file.originalname);
  if (scanStatus === 'infected' || scanStatus === 'scan_failed') {
    throw new AppError(400, 'This file could not be accepted', 'SCAN');
  }
  const storageKey = await saveFile({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    mime: req.file.mimetype,
    visibility: 'private',
  });
  const doc = await DocumentFile.create({
    customerId: order.customerId,
    orderId: order._id,
    label: String(req.body.label || req.file.originalname),
    checklistItemId: req.body.checklistItemId || undefined,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey,
    visibility: 'private',
    status: 'received',
    scanStatus,
    uploadedBy: req.user!.id,
  });
  if (req.body.checklistItemId) {
    await Application.updateOne(
      { orderId: order._id, 'checklist._id': req.body.checklistItemId },
      { $set: { 'checklist.$.status': 'received', 'checklist.$.documentId': doc._id } },
    );
  }
  await writeAudit(req, 'document.upload', 'Document', doc._id, { orderId: String(order._id) });
  res.status(201).json({ data: { id: doc._id, status: doc.status, scanStatus: doc.scanStatus } });
});

export const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentFile.findById(req.params.id);
  if (!doc || doc.archived || doc.visibility === 'public') throw notFound();
  assertSameCustomer(req, doc.customerId);
  await writeAudit(req, 'document.download', 'Document', doc._id, {});
  const signed = await signedDownload(doc.storageKey, 'private');
  if (signed) {
    res.json({ data: { url: signed } });
    return;
  }
  const buffer = await readFile(doc.storageKey, 'private');
  res.setHeader('content-type', doc.mimeType);
  res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
  res.setHeader('cache-control', 'private, no-store');
  res.send(buffer);
});

export const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ customerId: req.user!.customerId }).sort({ createdAt: -1 }).lean();
  const invoices = await Invoice.find({ customerId: req.user!.customerId }).sort({ createdAt: -1 }).lean();
  res.json({ data: { payments, invoices } });
});

export const myInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, customerId: req.user!.customerId }).lean();
  if (!invoice) throw notFound();
  res.json({ data: invoice });
});

export const startPayment = asyncHandler(async (req, res) => {
  const result = await createCheckout(req.params.id, req.user!.customerId!);
  res.json({ data: result });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const input = z
    .object({
      paymentId: z.string(),
      providerOrderId: z.string(),
      providerPaymentId: z.string(),
      signature: z.string(),
    })
    .parse(req.body);
  const result = await verifyCheckout({ ...input, customerId: req.user!.customerId! });
  res.json({ data: { status: result.payment.status, duplicate: result.duplicate } });
});

export const myTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ customerId: req.user!.customerId }).sort({ updatedAt: -1 }).lean();
  res.json({
    data: tickets.map((ticket) => ({
      ...ticket,
      messages: ticket.messages.filter((message) => message.visibility === 'customer'),
    })),
  });
});

export const createTicket = asyncHandler(async (req, res) => {
  const input = ticketCreateSchema.parse(req.body);
  if (input.orderId) {
    const order = await Order.findOne({ _id: input.orderId, customerId: req.user!.customerId });
    if (!order) throw notFound('Order not found');
  }
  const ticket = await SupportTicket.create({
    customerId: req.user!.customerId,
    orderId: input.orderId,
    subject: input.subject,
    category: input.category,
    priority: input.priority,
    status: 'open',
    messages: [{ body: input.message, authorId: req.user!.id, authorRole: 'customer', visibility: 'customer', createdAt: new Date() }],
  });
  res.status(201).json({ data: ticket });
});

export const replyTicket = asyncHandler(async (req, res) => {
  const input = ticketReplySchema.parse(req.body);
  const ticket = await SupportTicket.findOne({ _id: req.params.id, customerId: req.user!.customerId });
  if (!ticket) throw notFound();
  ticket.messages.push({ body: input.body, authorId: req.user!.id as never, authorRole: 'customer', visibility: 'customer', createdAt: new Date() });
  if (ticket.status === 'resolved' || ticket.status === 'closed') ticket.status = 'open';
  await ticket.save();
  res.json({ data: ticket });
});

export const myNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ data: items });
});

export const readNotification = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { readAt: new Date() }, { new: true });
  if (!item) throw notFound();
  res.json({ data: item });
});
