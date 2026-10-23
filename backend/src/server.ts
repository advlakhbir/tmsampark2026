import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { publishDuePosts } from './jobs/publish.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb();
  const app = createApp();
  setInterval(() => {
    publishDuePosts().catch((error) => logger.error({ err: error }, 'scheduled publish failed'));
  }, 60_000).unref();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'TMSAMPARK API listening');
  });
}

main().catch((error) => {
  logger.error({ err: error }, 'API failed to start');
  process.exit(1);
});
