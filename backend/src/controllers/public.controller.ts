import { enquirySchema, readingTimeMinutes, slugify, trackSchema } from '@tmsampark/shared';
import { Application, BlogCategory, BlogPost, Customer, FAQ, Redirect, Service, ServiceCategory, ServicePackage, Testimonial } from '../models/index.js';
import { createEnquiry } from '../services/lead.service.js';
import { publishDuePosts } from '../jobs/publish.js';
import { getSettings, toPublicSettings } from '../services/settings.service.js';
import { readFile } from '../services/storage.service.js';
import { asyncHandler } from '../utils/async.js';
import { notFound } from '../utils/errors.js';
import { escapeRegex, pageMeta, parsePage } from '../utils/pagination.js';

export const publicSettings = asyncHandler(async (_req, res) => {
  res.json({ data: toPublicSettings(await getSettings()) });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await ServiceCategory.find({ status: 'published' }).sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ data: categories });
});

export const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter: Record<string, unknown> = { status: 'published' };
  const categorySlug = String(req.query.category || '');
  if (categorySlug) {
    const category = await ServiceCategory.findOne({ slug: categorySlug, status: 'published' });
    filter.categoryId = category?._id ?? null;
  }
  if (req.query.featured === 'true') filter.featured = true;
  const q = String(req.query.q || '').trim();
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { summary: regex }];
  }
  const [items, total] = await Promise.all([
    Service.find(filter).sort({ featured: -1, name: 1 }).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);
  const categories = await ServiceCategory.find({ _id: { $in: items.map((item) => item.categoryId) } }).lean();
  const packages = await ServicePackage.find({ serviceId: { $in: items.map((item) => item._id) }, active: true }).lean();
  const data = items.map((item) => {
    const category = categories.find((entry) => String(entry._id) === String(item.categoryId));
    const fees = packages.filter((entry) => String(entry.serviceId) === String(item._id));
    const starting = fees.reduce((min, entry) => (min === null || entry.professionalFeePaise < min ? entry.professionalFeePaise : min), null as number | null);
    return {
      ...item,
      categorySlug: category?.slug || '',
      categoryName: category?.name || '',
      startingProfessionalFeePaise: starting,
      packages: fees,
    };
  });
  res.json({ data, meta: pageMeta(page, limit, total) });
});

export const serviceDetail = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findOne({ slug: req.params.categorySlug, status: 'published' });
  if (!category) throw notFound('Service not found');
  const service = await Service.findOne({ slug: req.params.serviceSlug, categoryId: category._id, status: 'published' }).lean();
  if (!service) throw notFound('Service not found');
  const packages = await ServicePackage.find({ serviceId: service._id, active: true }).sort({ professionalFeePaise: 1 }).lean();
  const related = await Service.find({ slug: { $in: service.relatedSlugs || [] }, status: 'published' }).select('name slug summary categoryId').lean();
  const relatedCategories = await ServiceCategory.find({ _id: { $in: related.map((item) => item.categoryId) } }).lean();
  res.json({
    data: {
      ...service,
      category: { name: category.name, slug: category.slug },
      packages,
      related: related.map((item) => ({
        ...item,
        categorySlug: relatedCategories.find((entry) => String(entry._id) === String(item.categoryId))?.slug || '',
      })),
    },
  });
});

export const categoryDetail = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findOne({ slug: req.params.slug, status: 'published' }).lean();
  if (!category) throw notFound('Category not found');
  const services = await Service.find({ categoryId: category._id, status: 'published' }).sort({ name: 1 }).lean();
  const packages = await ServicePackage.find({ serviceId: { $in: services.map((item) => item._id) }, active: true }).lean();
  const withFees = services.map((item) => {
    const fees = packages.filter((entry) => String(entry.serviceId) === String(item._id));
    const starting = fees.reduce((min, entry) => (min === null || entry.professionalFeePaise < min ? entry.professionalFeePaise : min), null as number | null);
    return { ...item, startingProfessionalFeePaise: starting, feeIsSample: item.feeIsSample };
  });
  res.json({ data: { category, services: withFees } });
});

export const listFaqs = asyncHandler(async (req, res) => {
  const placement = req.query.placement === 'home' ? { $in: ['home', 'both'] } : { $in: ['faq', 'both', 'home'] };
  const faqs = await FAQ.find({ status: 'published', placement }).sort({ sortOrder: 1 }).lean();
  res.json({ data: faqs });
});

export const listTestimonials = asyncHandler(async (_req, res) => {
  const items = await Testimonial.find({ status: 'published', authorized: true }).sort({ createdAt: -1 }).lean();
  res.json({ data: items });
});

export const listPosts = asyncHandler(async (req, res) => {
  await publishDuePosts();
  const { page, limit, skip } = parsePage(req.query);
  const filter: Record<string, unknown> = { status: 'published' };
  const q = String(req.query.q || '').trim();
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
  }
  if (req.query.tag) filter.tags = String(req.query.tag);
  if (req.query.category) {
    const category = await BlogCategory.findOne({ slug: String(req.query.category) });
    filter.categoryId = category?._id ?? null;
  }
  const [items, total] = await Promise.all([
    BlogPost.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).select('-content').lean(),
    BlogPost.countDocuments(filter),
  ]);
  res.json({ data: items, meta: pageMeta(page, limit, total) });
});

export const postDetail = asyncHandler(async (req, res) => {
  await publishDuePosts();
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).lean();
  if (!post) throw notFound('Article not found');
  const related = await BlogPost.find({ status: 'published', _id: { $ne: post._id }, tags: { $in: post.tags || [] } })
    .select('title slug excerpt readingTimeMinutes')
    .limit(3)
    .lean();
  res.json({ data: { ...post, related } });
});

export const blogCategories = asyncHandler(async (_req, res) => {
  res.json({ data: await BlogCategory.find().sort({ name: 1 }).lean() });
});

export const createPublicEnquiry = asyncHandler(async (req, res) => {
  const input = enquirySchema.parse(req.body);
  const result = await createEnquiry(input, { ip: req.ip || '' });
  res.status(result.duplicate ? 200 : 201).json({ data: result });
});

export const trackApplication = asyncHandler(async (req, res) => {
  const input = trackSchema.parse(req.body);
  const application = await Application.findOne({ referenceNumber: input.referenceNumber.trim().toUpperCase() });
  const customer = application ? await Customer.findById(application.customerId) : null;
  if (!application || !customer || customer.email !== input.email.toLowerCase()) {
    throw notFound('No application matched those details');
  }
  res.json({
    data: {
      referenceNumber: application.referenceNumber,
      serviceName: application.serviceName,
      status: application.status,
      estimatedCompletionDate: application.estimatedCompletionDate,
      timeline: (application.timeline || []).filter((item) => item.visibleToCustomer),
      checklist: (application.checklist || []).map((item) => ({ label: item.label, status: item.status })),
    },
  });
});

export const listRedirects = asyncHandler(async (_req, res) => {
  const redirects = await Redirect.find().select('fromPath toPath statusCode').lean();
  res.json({ data: redirects });
});

export const publicMedia = asyncHandler(async (req, res) => {
  const key = req.params[0];
  const service = await Service.findOne({ imageKey: key, status: 'published' });
  const post = await BlogPost.findOne({ 'seo.ogImage': key, status: 'published' });
  if (!service && !post) throw notFound();
  const buffer = await readFile(key, 'public');
  res.setHeader('cache-control', 'public, max-age=86400');
  res.send(buffer);
});

export function normaliseSlug(value: string): string {
  return slugify(value);
}

export function estimateReading(content: string): number {
  return readingTimeMinutes(content);
}
