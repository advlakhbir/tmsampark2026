import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get('x-request-id');
  req.requestId = incoming && /^[\w-]{8,80}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}
