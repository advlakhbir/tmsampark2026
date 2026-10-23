import { Schema, type InferSchemaType } from 'mongoose';
import { registerModel } from './register.js';

const checklistSchema = new Schema(
  {
    label: { type: String, required: true },
    status: { type: String, enum: ['requested', 'received', 'approved', 'rejected'], default: 'requested' },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
  },
  { _id: true },
);

const timelineSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    visibleToCustomer: { type: Boolean, default: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'ServicePackage' },
    packageName: { type: String, required: true },
    addOns: { type: [{ name: String, pricePaise: Number }], default: [] },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'payment_confirmed',
        'documents_pending',
        'under_review',
        'processing',
        'completed',
        'on_hold',
        'cancelled',
        'rejected',
      ],
      default: 'pending_payment',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    estimatedCompletionDate: { type: Date },
    professionalFeePaise: { type: Number, required: true },
    governmentFeePaise: { type: Number, default: 0 },
    addOnPaise: { type: Number, default: 0 },
    taxPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    gstRatePercent: { type: Number, default: 18 },
    feeIsSample: { type: Boolean, default: false },
    internalNotes: {
      type: [{ body: String, authorId: Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now } }],
      default: [],
    },
    statusHistory: { type: [timelineSchema], default: [] },
  },
  { timestamps: true },
);

const applicationSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    serviceName: { type: String, required: true },
    status: { type: String, required: true, index: true },
    timeline: { type: [timelineSchema], default: [] },
    checklist: { type: [checklistSchema], default: [] },
    estimatedCompletionDate: { type: Date },
  },
  { timestamps: true },
);

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    provider: { type: String, enum: ['razorpay', 'manual'], required: true },
    providerOrderId: { type: String, default: '' },
    providerPaymentId: { type: String, default: '' },
    amountPaise: { type: Number, required: true },
    taxPaise: { type: Number, default: 0 },
    professionalFeePaise: { type: Number, default: 0 },
    governmentFeePaise: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    signatureVerified: { type: Boolean, default: false },
    idempotencyKey: { type: String, index: true },
    reconciliation: {
      reconciled: { type: Boolean, default: false },
      reference: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

const invoiceSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    lineItems: { type: [{ description: String, amountPaise: Number }], default: [] },
    subtotalPaise: { type: Number, required: true },
    taxPaise: { type: Number, required: true },
    totalPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['issued', 'void'], default: 'issued' },
  },
  { timestamps: true },
);

const refundSchema = new Schema(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amountPaise: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['requested', 'approved', 'processed', 'rejected'], default: 'requested', index: true },
    providerRefundId: { type: String, default: '' },
  },
  { timestamps: true },
);

const webhookEventSchema = new Schema(
  {
    provider: { type: String, required: true },
    eventId: { type: String, required: true, unique: true },
    type: { type: String, default: '' },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: import('mongoose').Types.ObjectId };
export const Order = registerModel('Order', orderSchema);
export const Application = registerModel('Application', applicationSchema);
export const Payment = registerModel('Payment', paymentSchema);
export const Invoice = registerModel('Invoice', invoiceSchema);
export const Refund = registerModel('Refund', refundSchema);
export const WebhookEvent = registerModel('WebhookEvent', webhookEventSchema);
