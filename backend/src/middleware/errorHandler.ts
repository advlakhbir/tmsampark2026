import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Resource not found', code: 'NOT_FOUND' }, requestId: _req.requestId });
}

function isJsonParseError(err: unknown): boolean {
  return err instanceof SyntaxError && typeof err === 'object' && err !== null && 'type' in err && (err as { type?: string }).type === 'entity.parse.failed';
}

function isZodError(err: unknown): err is { issues: { path: PropertyKey[]; message: string }[] } {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { name?: string; issues?: unknown };
  return candidate.name === 'ZodError' && Array.isArray(candidate.issues);
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError || isZodError(err)) {
    const issues = err instanceof ZodError ? err.issues : err.issues;
    res.status(400).json({
      error: {
        message: 'Please correct the highlighted fields',
        code: 'VALIDATION_ERROR',
        details: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      requestId: req.requestId,
    });
    return;
  }

  const malformedJson = isJsonParseError(err);
  const status = err instanceof AppError ? err.status : malformedJson ? 400 : 500;
  const code = err instanceof AppError ? err.code : malformedJson ? 'INVALID_JSON' : 'INTERNAL';
  const message = err instanceof AppError ? err.message : malformedJson ? 'The request body is not valid JSON.' : 'Something went wrong. Please try again.';

  if (status >= 500) {
    logger.error({ err, requestId: req.requestId, path: req.path }, 'request failed');
  }

  res.status(status).json({
    error: {
      message,
      code,
      details: err instanceof AppError ? err.details : undefined,
      ...(env.NODE_ENV !== 'production' && status >= 500 ? { stack: err instanceof Error ? err.stack : undefined } : {}),
    },
    requestId: req.requestId,
  });
}
