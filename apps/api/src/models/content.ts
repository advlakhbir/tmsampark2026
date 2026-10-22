import { Schema, type InferSchemaType } from 'mongoose';
import { registerModel } from './register.js';

const seoSchema = {
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  canonical: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  index: { type: Boolean, default: true },
};

const blogCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
    tags: { type: [String], default: [] },
    authorName: { type: String, default: 'TMSAMPARK Editorial' },
    authorRole: { type: String, default: 'Editorial' },
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    seo: seoSchema,
    readingTimeMinutes: { type: Number, default: 1 },
  },
  { timestamps: true },
);

blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

const faqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General' },
    placement: { type: String, enum: ['home', 'faq', 'both'], default: 'both' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  },
  { timestamps: true },
);

const testimonialSchema = new Schema(
  {
    quote: { type: String, required: true },
    personName: { type: String, required: true },
    personRole: { type: String, default: '' },
    organization: { type: String, default: '' },
    authorized: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true },
);

const siteSettingsSchema = new Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    brandName: { type: String, default: 'TMSAMPARK' },
    tagline: { type: String, default: 'All In One Platform For Business Registration, Compliance, HR & Legal Tech' },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      hours: { type: String, default: 'Monday to Friday, 10:00–18:00 IST' },
    },
    social: {
      linkedin: { type: String, default: '' },
      x: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      text: {
        type: String,
        default: 'TMSAMPARK is a private services firm. We are not a government website.',
      },
      href: { type: String, default: '/disclaimer' },
    },
    tax: {
      gstRatePercent: { type: Number, default: 18 },
      note: {
        type: String,
        default: 'GST is added to professional fees where applicable. Confirm the tax treatment on your invoice.',
      },
    },
    seo: {
      titleSuffix: { type: String, default: 'TMSAMPARK' },
      defaultDescription: {
        type: String,
        default:
          'TMSAMPARK helps Indian businesses prepare company, tax, licence, and compliance applications with a written scope and a trackable process.',
      },
    },
    policies: {
      privacy: { type: String, default: '' },
      terms: { type: String, default: '' },
      refund: { type: String, default: '' },
      disclaimer: { type: String, default: '' },
      legallyReviewed: { type: Boolean, default: false },
    },
    verifiedMetrics: {
      type: [{ label: String, value: Number, sourceNote: String }],
      default: [],
    },
    navigation: { type: [{ href: String, label: String }], default: [] },
    address: { type: String, default: '' },
    organizationVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const redirectSchema = new Schema(
  {
    fromPath: { type: String, required: true, unique: true },
    toPath: { type: String, required: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
  },
  { timestamps: true },
);

export const BlogCategory = registerModel('BlogCategory', blogCategorySchema);
export const BlogPost = registerModel('BlogPost', blogPostSchema);
export const FAQ = registerModel('FAQ', faqSchema);
export const Testimonial = registerModel('Testimonial', testimonialSchema);
export const SiteSettings = registerModel('SiteSettings', siteSettingsSchema);
export const Redirect = registerModel('Redirect', redirectSchema);
