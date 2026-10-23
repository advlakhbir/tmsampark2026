import { Schema, type InferSchemaType } from 'mongoose';
import { registerModel } from './register.js';

const documentSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    checklistItemId: { type: Schema.Types.ObjectId },
    label: { type: String, default: '' },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
    status: {
      type: String,
      enum: ['requested', 'received', 'approved', 'rejected'],
      default: 'received',
      index: true,
    },
    scanStatus: { type: String, enum: ['not_scanned', 'clean', 'infected', 'scan_failed'], default: 'not_scanned' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ticketMessageSchema = new Schema(
  {
    body: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorRole: { type: String, default: 'customer' },
    visibility: { type: String, enum: ['internal', 'customer'], default: 'customer' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ticketSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    subject: { type: String, required: true },
    category: { type: String, default: 'General' },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: { type: [ticketMessageSchema], default: [] },
  },
  { timestamps: true },
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String, default: '' },
    channel: { type: String, enum: ['in_app', 'email', 'sms'], default: 'in_app' },
    delivery: { type: String, enum: ['stored', 'sent', 'skipped', 'failed'], default: 'stored' },
    deliveryReason: { type: String, default: '' },
    readAt: { type: Date },
  },
  { timestamps: true },
);

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String, default: '' },
    requestId: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const DocumentFile = registerModel('Document', documentSchema);
export const SupportTicket = registerModel('SupportTicket', ticketSchema);
export const Notification = registerModel('Notification', notificationSchema);
export const AuditLog = registerModel('AuditLog', auditLogSchema);
