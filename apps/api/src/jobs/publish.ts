import { BlogPost } from '../models/index.js';

export async function publishDuePosts(): Promise<void> {
  const now = new Date();
  await BlogPost.updateMany(
    { status: 'scheduled', scheduledFor: { $lte: now } },
    { $set: { status: 'published', publishedAt: now } },
  );
}
