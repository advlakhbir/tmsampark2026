import { Schema, type InferSchemaType } from 'mongoose';
import { registerModel } from './register.js';

const customerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

const contactEnquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    source: { type: String, required: true },
    serviceSlug: { type: String, default: '' },
    consentAt: { type: Date, required: true },
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    landingPath: { type: String, default: '' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const leadSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    source: {
      type: String,
      enum: ['contact', 'consultation', 'service_enquiry', 'apply_now'],
      required: true,
      index: true,
    },
    serviceSlug: { type: String, default: '', index: true },
    serviceName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      default: 'new',
      index: true,
    },
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    landingPath: { type: String, default: '' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    followUpAt: { type: Date },
    consentAt: { type: Date, required: true },
    notes: {
      type: [{ body: String, authorId: Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now } }],
      default: [],
    },
    activities: { type: [activitySchema], default: [] },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Lead' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    contactEnquiryId: { type: Schema.Types.ObjectId, ref: 'ContactEnquiry' },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1, serviceSlug: 1, source: 1, createdAt: -1 });

export type LeadDoc = InferSchemaType<typeof leadSchema> & { _id: import('mongoose').Types.ObjectId; createdAt?: Date; updatedAt?: Date };
export const Customer = registerModel('Customer', customerSchema);
export const ContactEnquiry = registerModel('ContactEnquiry', contactEnquirySchema);
export const Lead = registerModel('Lead', leadSchema);
