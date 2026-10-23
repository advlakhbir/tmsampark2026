import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins, env } from './config/env.js';
import { requestContext } from './middleware/requestContext.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rejectQueryOperators } from './middleware/validate.js';
import { api } from './routes/index.js';
import { handleRazorpayWebhook } from './services/payment.service.js';
import { openApiSpec } from './openapi.js';
import { asyncHandler } from './utils/async.js';

export function createApp() {
  const app = express();
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(cookieParser());

  const skip = () => env.NODE_ENV === 'test';
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false, skip }));
  app.post(
    '/api/v1/auth/login',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, skip }),
  );
  app.post(
    '/api/v1/enquiries',
    rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, skip }),
  );

  app.post(
    '/api/v1/payments/webhook/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    asyncHandler(async (req, res) => {
      const result = await handleRazorpayWebhook(
        req.body as Buffer,
        req.get('x-razorpay-signature') || '',
        req.get('x-razorpay-event-id') || undefined,
      );
      res.json({ data: result });
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use((req, _res, next) => {
    try {
      rejectQueryOperators(req.body);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
