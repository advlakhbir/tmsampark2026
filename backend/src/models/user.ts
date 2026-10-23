import { Schema, type InferSchemaType } from 'mongoose';
import { registerModel } from './register.js';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    role: {
      type: String,
      enum: ['super_admin', 'operations_manager', 'support_agent', 'content_editor', 'customer'],
      required: true,
    },
    status: { type: String, enum: ['active', 'suspended', 'invited'], default: 'active' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    mustChangePassword: { type: Boolean, default: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    csrfToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: import('mongoose').Types.ObjectId };
export const User = registerModel('User', userSchema);
export const Session = registerModel('Session', sessionSchema);
