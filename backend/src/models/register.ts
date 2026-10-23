import mongoose, { type Schema } from 'mongoose';

export function registerModel(name: string, schema: Schema): any {
  return mongoose.models[name] || mongoose.model(name, schema);
}
