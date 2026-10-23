import { Schema, type InferSchemaType } from 'mongoose';
import { registerModel } from './register.js';

const seoSchema = {
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  canonical: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  index: { type: Boolean, default: true },
};

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    summary: { type: String, default: '' },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    seo: seoSchema,
  },
  { timestamps: true },
);

const packageSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    professionalFeePaise: { type: Number, required: true, min: 0 },
    governmentFeePaise: { type: Number, default: 0, min: 0 },
    governmentFeeNote: { type: String, default: 'Government charges are extra unless this package says they are included.' },
    included: { type: [String], default: [] },
    excluded: { type: [String], default: [] },
    highlighted: { type: Boolean, default: false },
    feeIsSample: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const serviceSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    summary: { type: String, default: '' },
    overview: { type: String, default: '' },
    whoNeeds: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    eligibility: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    documents: {
      type: [{ name: String, description: String, mandatory: { type: Boolean, default: true } }],
      default: [],
    },
    process: { type: [{ title: String, description: String }], default: [] },
    deliverables: { type: [String], default: [] },
    addOns: { type: [{ name: String, description: String, pricePaise: Number }], default: [] },
    timeline: {
      estimate: { type: String, default: '' },
      dependencies: { type: [String], default: [] },
    },
    faqs: { type: [{ question: String, answer: String }], default: [] },
    relatedSlugs: { type: [String], default: [] },
    seo: seoSchema,
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    featured: { type: Boolean, default: false, index: true },
    imageKey: { type: String, default: '' },
    disclaimer: { type: String, default: '' },
    feeIsSample: { type: Boolean, default: true },
  },
  { timestamps: true },
);

serviceSchema.index({ name: 'text', summary: 'text', overview: 'text' });

export type ServiceDoc = InferSchemaType<typeof serviceSchema> & { _id: import('mongoose').Types.ObjectId };
export const ServiceCategory = registerModel('ServiceCategory', categorySchema);
export const Service = registerModel('Service', serviceSchema);
export const ServicePackage = registerModel('ServicePackage', packageSchema);
