import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);
// Do not enable sanitizeFilter globally. Mongoose rewrites legitimate
// operator queries such as `{ _id: { $in: ids } }` and the cast then fails.
// Request bodies are checked separately for unexpected `$` keys.

export async function connectDb(uri = env.MONGODB_URI): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, { autoIndex: true });
  logger.info('MongoDB connected');
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
