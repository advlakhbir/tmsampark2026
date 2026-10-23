import { leadUpdateSchema, orderCreateSchema, orderStatusSchema, readingTimeMinutes, slugify, STAFF_ROLES } from '@tmsampark/shared';
import { z } from 'zod';
import {
  Application,
  AuditLog,
  BlogCategory,
  BlogPost,
  Customer,
  DocumentFile,
  FAQ,
  Invoice,
  Lead,
  Order,
  Payment,
  Redirect,
  Refund,
  Service,
  ServiceCategory,
  ServicePackage,
  SupportTicket,
  Testimonial,
  User,
} from '../models/index.js';
import { writeAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notify.service.js';
import { createOrder, updateOrderStatus } from '../services/order.service.js';
import { recordManualPayment, requestRefund } from '../services/payment.service.js';
import { getSettings, toPublicSettings } from '../services/settings.service.js';
import { readFile, saveFile, signedDownload } from '../services/storage.service.js';
import { asyncHandler } from '../utils/async.js';
import { AppError, notFound } from '../utils/errors.js';
import { escapeRegex, pageMeta, parsePage } from '../utils/pagination.js';
import { env, isEmailConfigured, isRazorpayConfigured, isS3Configured, isSmsConfigured } from '../config/env.js';

function createdRange(query: { from?: unknown; to?: unknown }) {
  const createdAt: { $gte?: Date; $lte?: Date } = {};
  if (query.from) createdAt.$gte = new Date(String(query.from));
  if (query.to) {
    const end = new Date(String(query.to));
    end.setHours(23, 59, 59, 999);
    createdAt.$lte = end;
  }
  return Object.keys(createdAt).length ? { createdAt } : {};
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (value: unknown) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((header) => esc(row[header])).join(','))].join('\n');
}

export const dashboard = asyncHandler(async (req, res) => {
  const match = createdRange(req.query);
  const [leadTotal, leadGroups, orderTotal, orderGroups, revenue, recentLeads, recentOrders] = await Promise.all([
    Lead.countDocuments(match),
    Lead.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(match),
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { ...match, status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]),
    Lead.find(match).sort({ createdAt: -1 }).limit(8).lean(),
    Order.find(match).sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  const newLeads = leadGroups.find((item) => item._id === 'new')?.count || 0;
  res.json({
    data: {
      leadTotal,
      newLeads,
      leadsByStatus: Object.fromEntries(leadGroups.map((item) => [item._id, item.count])),
      orderTotal,
      ordersByStatus: Object.fromEntries(orderGroups.map((item) => [item._id, item.count])),
      capturedRevenuePaise: revenue[0]?.total || 0,
      recentLeads,
      recentOrders,
      note: 'Figures are counted from stored records in the selected dates. They are not marketing claims.',
    },
  });
});

export const listLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter: Record<string, unknown> = { ...createdRange(req.query) };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.source) filter.source = String(req.query.source);
  if (req.query.service) filter.serviceSlug = String(req.query.service);
  if (req.query.assignedTo) filter.assignedTo = String(req.query.assignedTo);
  const q = String(req.query.q || '').trim();
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);
  res.json({ data: items, meta: pageMeta(page, limit, total) });
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id).lean();
  if (!lead) throw notFound();
  const customer = await Customer.findOne({ email: lead.email }).lean();
  res.json({ data: { ...lead, matchingCustomer: customer } });
});

export const patchLead = asyncHandler(async (req, res) => {
  const input = leadUpdateSchema.parse(req.body);
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw notFound();
  if (input.assignedTo) {
    const staff = await User.findOne({ _id: input.assignedTo, role: { $in: STAFF_ROLES } });
    if (!staff) throw new AppError(400, 'Assignee must be an active staff user', 'ASSIGNEE');
    lead.assignedTo = staff._id;
    lead.activities.push({ type: 'assigned', message: `Assigned to ${staff.name}`, at: new Date(), actorId: req.user!.id as never });
  }
  if (input.assignedTo === null) lead.assignedTo = undefined;
  if (input.status) {
    lead.status = input.status;
    lead.activities.push({ type: 'status', message: `Status set to ${input.status}`, at: new Date(), actorId: req.user!.id as never });
  }
  if (input.followUpAt !== undefined) lead.followUpAt = input.followUpAt ? new Date(input.followUpAt) : undefined;
  if (input.note) {
    lead.notes.push({ body: input.note, authorId: req.user!.id as never, createdAt: new Date() });
    lead.activities.push({ type: 'note', message: 'Internal note added', at: new Date(), actorId: req.user!.id as never });
  }
  await lead.save();
  await writeAudit(req, 'lead.update', 'Lead', lead._id, { status: lead.status });
  res.json({ data: lead });
});

export const exportLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find(createdRange(req.query)).sort({ createdAt: -1 }).limit(5000).lean();
  const csv = toCsv(
    leads.map((lead) => ({
      createdAt: lead.createdAt,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      service: lead.serviceName,
      status: lead.status,
      campaign: lead.utm?.campaign || '',
    })),
  );
  await writeAudit(req, 'lead.export', 'Lead', '', { count: leads.length });
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.send(csv);
});

export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter: Record<string, unknown> = {};
  const q = String(req.query.q || '').trim();
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);
  res.json({ data: items, meta: pageMeta(page, limit, total) });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) throw notFound();
  const [leads, orders, documents, tickets] = await Promise.all([
    Lead.find({ email: customer.email }).sort({ createdAt: -1 }).lean(),
    Order.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean(),
    DocumentFile.find({ customerId: customer._id, archived: false }).select('-storageKey').lean(),
    SupportTicket.find({ customerId: customer._id }).sort({ updatedAt: -1 }).lean(),
  ]);
  res.json({ data: { customer, leads, orders, documents, tickets } });
});

export const postCustomer = asyncHandler(async (req, res) => {
  const input = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(8),
      notes: z.string().optional(),
    })
    .parse(req.body);
  const email = input.email.toLowerCase();
  const existing = await Customer.findOne({ email });
  if (existing) {
    res.json({ data: existing, duplicate: true });
    return;
  }
  const customer = await Customer.create({ ...input, email });
  await writeAudit(req, 'customer.create', 'Customer', customer._id, { email });
  res.status(201).json({ data: customer });
});

export const postOrder = asyncHandler(async (req, res) => {
  const input = orderCreateSchema.parse(req.body);
  const result = await createOrder(input, req);
  res.status(201).json({ data: result });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter: Record<string, unknown> = { ...createdRange(req.query) };
  if (req.query.status) filter.status = String(req.query.status);
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ data: items, meta: pageMeta(page, limit, total) });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw notFound();
  const [application, payments, invoices, documents] = await Promise.all([
    Application.findOne({ orderId: order._id }).lean(),
    Payment.find({ orderId: order._id }).lean(),
    Invoice.find({ orderId: order._id }).lean(),
    DocumentFile.find({ orderId: order._id }).select('-storageKey').lean(),
  ]);
  res.json({ data: { order, application, payments, invoices, documents } });
});

export const patchOrderStatus = asyncHandler(async (req, res) => {
  const input = orderStatusSchema.parse(req.body);
  const order = await updateOrderStatus(req.params.id, input, req);
  res.json({ data: order });
});

export const postOrderNote = asyncHandler(async (req, res) => {
  const body = z.object({ note: z.string().min(1).max(2000) }).parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound();
  order.internalNotes.push({ body: body.note, authorId: req.user!.id as never, createdAt: new Date() });
  await order.save();
  res.json({ data: order });
});

const serviceBody = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  slug: z.string().optional(),
  summary: z.string().default(''),
  overview: z.string().default(''),
  whoNeeds: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  eligibility: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  documents: z.array(z.object({ name: z.string(), description: z.string().default(''), mandatory: z.boolean().default(true) })).default([]),
  process: z.array(z.object({ title: z.string(), description: z.string().default('') })).default([]),
  deliverables: z.array(z.string()).default([]),
  addOns: z.array(z.object({ name: z.string(), description: z.string().default(''), pricePaise: z.number().int().nonnegative() })).default([]),
  timeline: z.object({ estimate: z.string().default(''), dependencies: z.array(z.string()).default([]) }).default({ estimate: '', dependencies: [] }),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  relatedSlugs: z.array(z.string()).default([]),
  seo: z
    .object({
      title: z.string().default(''),
      description: z.string().default(''),
      canonical: z.string().default(''),
      ogImage: z.string().default(''),
      index: z.boolean().default(true),
    })
    .default({ title: '', description: '', canonical: '', ogImage: '', index: true }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  disclaimer: z.string().default(''),
  feeIsSample: z.boolean().default(true),
});

export const getAdminService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).lean();
  if (!service) throw notFound();
  const packages = await ServicePackage.find({ serviceId: service._id }).lean();
  res.json({ data: { service, packages } });
});

export const listAdminServices = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = String(req.query.status);
  const services = await Service.find(filter).sort({ updatedAt: -1 }).lean();
  res.json({ data: services });
});

export const postService = asyncHandler(async (req, res) => {
  const input = serviceBody.parse(req.body);
  const slug = slugify(input.slug || input.name);
  if (await Service.findOne({ slug })) throw new AppError(409, 'That slug is already used', 'SLUG');
  const service = await Service.create({ ...input, slug });
  await writeAudit(req, 'service.create', 'Service', service._id, { slug });
  res.status(201).json({ data: service });
});

export const patchService = asyncHandler(async (req, res) => {
  const input = serviceBody.partial().parse(req.body);
  const service = await Service.findById(req.params.id);
  if (!service) throw notFound();
  if (input.slug || input.name) {
    const next = slugify(input.slug || service.slug);
    if (next !== service.slug) {
      await Redirect.updateOne({ fromPath: `/services/${next}` }, {}, { upsert: false });
      const category = await ServiceCategory.findById(service.categoryId);
      if (category) {
        await Redirect.findOneAndUpdate(
          { fromPath: `/services/${category.slug}/${service.slug}` },
          { fromPath: `/services/${category.slug}/${service.slug}`, toPath: `/services/${category.slug}/${next}`, statusCode: 301 },
          { upsert: true },
        );
      }
      input.slug = next;
    }
  }
  Object.assign(service, input);
  await service.save();
  await writeAudit(req, 'service.update', 'Service', service._id, { slug: service.slug });
  res.json({ data: service });
});

export const archiveService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
  if (!service) throw notFound();
  await writeAudit(req, 'service.archive', 'Service', service._id, {});
  res.json({ data: service });
});

export const postPackage = asyncHandler(async (req, res) => {
  const input = z
    .object({
      name: z.string().min(2),
      description: z.string().default(''),
      professionalFeePaise: z.number().int().nonnegative(),
      governmentFeePaise: z.number().int().nonnegative().default(0),
      governmentFeeNote: z.string().default(''),
      included: z.array(z.string()).default([]),
      excluded: z.array(z.string()).default([]),
      highlighted: z.boolean().default(false),
      feeIsSample: z.boolean().default(true),
    })
    .parse(req.body);
  const service = await Service.findById(req.params.id);
  if (!service) throw notFound();
  const pack = await ServicePackage.create({ ...input, serviceId: service._id });
  res.status(201).json({ data: pack });
});

export const listPackages = asyncHandler(async (req, res) => {
  res.json({ data: await ServicePackage.find({ serviceId: req.params.id }).lean() });
});

export const postCategory = asyncHandler(async (req, res) => {
  const input = z
    .object({
      name: z.string().min(2),
      slug: z.string().optional(),
      summary: z.string().default(''),
      description: z.string().default(''),
      status: z.enum(['draft', 'published', 'archived']).default('published'),
      seo: z.object({ title: z.string().default(''), description: z.string().default(''), canonical: z.string().default(''), ogImage: z.string().default(''), index: z.boolean().default(true) }).optional(),
    })
    .parse(req.body);
  const category = await ServiceCategory.create({ ...input, slug: slugify(input.slug || input.name) });
  res.status(201).json({ data: category });
});

export const listAdminCategories = asyncHandler(async (_req, res) => {
  res.json({ data: await ServiceCategory.find().sort({ sortOrder: 1, name: 1 }).lean() });
});

const postBody = z.object({
  title: z.string().min(4),
  slug: z.string().optional(),
  excerpt: z.string().default(''),
  content: z.string().default(''),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  authorName: z.string().default('TMSAMPARK Editorial'),
  authorRole: z.string().default('Editorial'),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
  scheduledFor: z.string().optional(),
  seo: z.object({ title: z.string().default(''), description: z.string().default(''), canonical: z.string().default(''), ogImage: z.string().default(''), index: z.boolean().default(true) }).optional(),
});

export const listAdminPosts = asyncHandler(async (_req, res) => {
  res.json({ data: await BlogPost.find().sort({ updatedAt: -1 }).lean() });
});

export const postArticle = asyncHandler(async (req, res) => {
  const input = postBody.parse(req.body);
  const slug = slugify(input.slug || input.title);
  const post = await BlogPost.create({
    ...input,
    slug,
    readingTimeMinutes: readingTimeMinutes(input.content),
    publishedAt: input.status === 'published' ? new Date() : undefined,
    scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
  });
  await writeAudit(req, 'blog.create', 'BlogPost', post._id, { slug });
  res.status(201).json({ data: post });
});

export const patchArticle = asyncHandler(async (req, res) => {
  const input = postBody.partial().parse(req.body);
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw notFound();
  const previous = post.slug;
  if (input.slug || input.title) input.slug = slugify(input.slug || post.slug);
  if (input.content) post.readingTimeMinutes = readingTimeMinutes(input.content);
  Object.assign(post, input);
  if (input.status === 'published' && !post.publishedAt) post.publishedAt = new Date();
  if (input.slug && input.slug !== previous) {
    await Redirect.findOneAndUpdate(
      { fromPath: `/blogs/${previous}` },
      { fromPath: `/blogs/${previous}`, toPath: `/blogs/${input.slug}`, statusCode: 301 },
      { upsert: true },
    );
  }
  await post.save();
  res.json({ data: post });
});

export const postFaq = asyncHandler(async (req, res) => {
  const input = z
    .object({
      question: z.string().min(5),
      answer: z.string().min(5),
      category: z.string().default('General'),
      placement: z.enum(['home', 'faq', 'both']).default('both'),
      sortOrder: z.number().default(0),
      status: z.enum(['draft', 'published', 'archived']).default('published'),
    })
    .parse(req.body);
  const faq = await FAQ.create(input);
  res.status(201).json({ data: faq });
});

export const listAdminFaqs = asyncHandler(async (_req, res) => {
  res.json({ data: await FAQ.find().sort({ sortOrder: 1 }).lean() });
});

export const patchFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) throw notFound();
  res.json({ data: faq });
});

export const postTestimonial = asyncHandler(async (req, res) => {
  const input = z
    .object({
      quote: z.string().min(10),
      personName: z.string().min(2),
      personRole: z.string().default(''),
      organization: z.string().default(''),
      authorized: z.literal(true),
      status: z.enum(['draft', 'published']).default('draft'),
    })
    .parse(req.body);
  const item = await Testimonial.create(input);
  await writeAudit(req, 'testimonial.create', 'Testimonial', item._id, { authorized: true });
  res.status(201).json({ data: item });
});

export const listAdminTestimonials = asyncHandler(async (_req, res) => {
  res.json({ data: await Testimonial.find().sort({ createdAt: -1 }).lean() });
});

export const listTickets = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = String(req.query.status);
  res.json({ data: await SupportTicket.find(filter).sort({ updatedAt: -1 }).lean() });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).lean();
  if (!ticket) throw notFound();
  res.json({ data: ticket });
});

export const patchTicket = asyncHandler(async (req, res) => {
  const input = z
    .object({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      assignedTo: z.string().optional(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
      body: z.string().optional(),
      visibility: z.enum(['internal', 'customer']).optional(),
    })
    .parse(req.body);
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw notFound();
  if (input.status) ticket.status = input.status;
  if (input.priority) ticket.priority = input.priority;
  if (input.assignedTo) ticket.assignedTo = input.assignedTo as never;
  if (input.body) {
    ticket.messages.push({
      body: input.body,
      authorId: req.user!.id as never,
      authorRole: req.user!.role,
      visibility: input.visibility || 'customer',
      createdAt: new Date(),
    });
    const customerUser = await User.findOne({ customerId: ticket.customerId });
    if (customerUser && (input.visibility || 'customer') === 'customer') {
      await notifyUser({
        userId: String(customerUser._id),
        title: `Reply on ticket: ${ticket.subject}`,
        body: input.body,
        href: `/customer/tickets/${ticket._id}`,
        email: true,
      });
    }
  }
  await ticket.save();
  res.json({ data: ticket });
});

export const listPayments = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { ...createdRange(req.query) };
  if (req.query.status) filter.status = String(req.query.status);
  const payments = await Payment.find(filter).sort({ createdAt: -1 }).lean();
  const refunds = await Refund.find().sort({ createdAt: -1 }).lean();
  res.json({ data: { payments, refunds } });
});

export const postManualPayment = asyncHandler(async (req, res) => {
  const input = z.object({ orderId: z.string(), reference: z.string().min(2), notes: z.string().optional() }).parse(req.body);
  const result = await recordManualPayment(input, req);
  res.status(201).json({ data: result.payment });
});

export const postRefund = asyncHandler(async (req, res) => {
  const input = z.object({ paymentId: z.string(), amountPaise: z.number().int().positive(), reason: z.string().min(3) }).parse(req.body);
  const refund = await requestRefund(input, req);
  res.status(201).json({ data: refund });
});

export const patchRefund = asyncHandler(async (req, res) => {
  const input = z.object({ status: z.enum(['requested', 'approved', 'processed', 'rejected']), providerRefundId: z.string().optional() }).parse(req.body);
  const refund = await Refund.findById(req.params.id);
  if (!refund) throw notFound();
  refund.status = input.status;
  if (input.providerRefundId) refund.providerRefundId = input.providerRefundId;
  if (input.status === 'processed') await Payment.findByIdAndUpdate(refund.paymentId, { status: 'refunded' });
  await refund.save();
  await writeAudit(req, 'refund.update', 'Refund', refund._id, { status: input.status });
  res.json({ data: refund });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { archived: false, visibility: 'private' };
  if (req.query.status) filter.status = String(req.query.status);
  const docs = await DocumentFile.find(filter).sort({ createdAt: -1 }).select('-storageKey').lean();
  res.json({ data: docs });
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const input = z.object({ status: z.enum(['approved', 'rejected']) }).parse(req.body);
  const doc = await DocumentFile.findById(req.params.id);
  if (!doc) throw notFound();
  doc.status = input.status;
  doc.reviewedBy = req.user!.id as never;
  await doc.save();
  if (doc.checklistItemId) {
    await Application.updateOne(
      { 'checklist._id': doc.checklistItemId },
      { $set: { 'checklist.$.status': input.status, 'checklist.$.documentId': doc._id } },
    );
  }
  await writeAudit(req, 'document.review', 'Document', doc._id, { status: input.status });
  res.json({ data: { id: doc._id, status: doc.status } });
});

export const adminDownload = asyncHandler(async (req, res) => {
  const doc = await DocumentFile.findById(req.params.id);
  if (!doc) throw notFound();
  await writeAudit(req, 'document.download', 'Document', doc._id, { via: 'admin' });
  const signed = await signedDownload(doc.storageKey, doc.visibility === 'public' ? 'public' : 'private');
  if (signed) {
    res.json({ data: { url: signed } });
    return;
  }
  const buffer = await readFile(doc.storageKey, doc.visibility === 'public' ? 'public' : 'private');
  res.setHeader('content-type', doc.mimeType);
  res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
  res.setHeader('cache-control', 'private, no-store');
  res.send(buffer);
});

export const uploadPublicImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'Choose an image', 'FILE');
  const key = await saveFile({ buffer: req.file.buffer, filename: req.file.originalname, mime: req.file.mimetype, visibility: 'public' });
  await DocumentFile.create({
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey: key,
    visibility: 'public',
    status: 'approved',
    scanStatus: 'not_scanned',
    uploadedBy: req.user!.id,
    label: 'public-image',
  });
  res.status(201).json({ data: { key } });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({
    data: {
      ...toPublicSettings(settings),
      integrations: {
        email: isEmailConfigured,
        razorpay: isRazorpayConfigured,
        sms: isSmsConfigured,
        storage: env.STORAGE_DRIVER,
        s3: isS3Configured,
        malwareScan: Boolean(env.MALWARE_SCAN_URL),
      },
    },
  });
});

export const putSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const input = req.body as Record<string, unknown>;
  const fields = ['brandName', 'tagline', 'contact', 'social', 'announcement', 'tax', 'seo', 'policies', 'verifiedMetrics', 'navigation', 'address', 'organizationVerified'] as const;
  for (const field of fields) {
    if (input[field] !== undefined) (settings as unknown as Record<string, unknown>)[field] = input[field];
  }
  if (Array.isArray(settings.verifiedMetrics)) {
    for (const metric of settings.verifiedMetrics) {
      if (!metric.sourceNote) throw new AppError(400, 'Each verified metric needs a source note', 'METRIC');
    }
  }
  if (settings.organizationVerified && !settings.address) {
    throw new AppError(400, 'Add an address before marking the organisation as verified', 'ORG');
  }
  await settings.save();
  await writeAudit(req, 'settings.update', 'SiteSettings', settings._id, {});
  res.json({ data: toPublicSettings(settings) });
});

export const listAssignees = asyncHandler(async (_req, res) => {
  const staff = await User.find({ role: { $in: STAFF_ROLES }, status: 'active' }).select('name role').lean();
  res.json({ data: staff });
});

export const listStaff = asyncHandler(async (_req, res) => {
  const staff = await User.find({ role: { $in: STAFF_ROLES } }).select('name email role status createdAt lastLoginAt').lean();
  res.json({ data: staff });
});

export const patchStaff = asyncHandler(async (req, res) => {
  const input = z.object({ role: z.enum(STAFF_ROLES).optional(), status: z.enum(['active', 'suspended']).optional() }).parse(req.body);
  const user = await User.findById(req.params.id);
  if (!user || user.role === 'customer') throw notFound();
  if (user.role === 'super_admin' && input.role && input.role !== 'super_admin') {
    const others = await User.countDocuments({ role: 'super_admin', status: 'active', _id: { $ne: user._id } });
    if (!others) throw new AppError(400, 'Keep at least one active super admin', 'LAST_ADMIN');
  }
  if (input.role) user.role = input.role;
  if (input.status) user.status = input.status;
  await user.save();
  await writeAudit(req, 'staff.update', 'User', user._id, input);
  res.json({ data: { id: user._id, role: user.role, status: user.status } });
});

export const listAudit = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const [items, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(),
  ]);
  res.json({ data: items, meta: pageMeta(page, limit, total) });
});

export const reports = asyncHandler(async (req, res) => {
  const match = createdRange(req.query);
  const [leads, orders, revenue, refunds, workload, demand] = await Promise.all([
    Lead.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { ...match, status: 'captured' } }, { $group: { _id: '$currency', totalPaise: { $sum: '$amountPaise' }, count: { $sum: 1 } } }]),
    Refund.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 }, amountPaise: { $sum: '$amountPaise' } } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$assignedTo', count: { $sum: 1 } } }]),
    Lead.aggregate([{ $match: match }, { $group: { _id: '$serviceName', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);
  res.json({ data: { leads, orders, revenue, refunds, workload, demand } });
});

export const exportReport = asyncHandler(async (req, res) => {
  const kind = String(req.query.kind || 'leads');
  const match = createdRange(req.query);
  if (kind === 'orders') {
    const rows = await Order.find(match).lean();
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.send(toCsv(rows.map((row) => ({ reference: row.referenceNumber, service: row.serviceName, status: row.status, totalPaise: row.totalPaise, createdAt: row.createdAt }))));
    return;
  }
  if (kind === 'revenue') {
    const rows = await Payment.find({ ...match, status: 'captured' }).lean();
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.send(toCsv(rows.map((row) => ({ provider: row.provider, amountPaise: row.amountPaise, status: row.status, createdAt: row.createdAt }))));
    return;
  }
  const rows = await Lead.find(match).lean();
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.send(toCsv(rows.map((row) => ({ name: row.name, email: row.email, status: row.status, source: row.source, createdAt: row.createdAt }))));
});

export const postRedirect = asyncHandler(async (req, res) => {
  const input = z.object({ fromPath: z.string().startsWith('/'), toPath: z.string().startsWith('/'), statusCode: z.union([z.literal(301), z.literal(302)]).default(301) }).parse(req.body);
  const redirect = await Redirect.findOneAndUpdate({ fromPath: input.fromPath }, input, { upsert: true, new: true });
  res.status(201).json({ data: redirect });
});

export const listAdminRedirects = asyncHandler(async (_req, res) => {
  res.json({ data: await Redirect.find().lean() });
});
