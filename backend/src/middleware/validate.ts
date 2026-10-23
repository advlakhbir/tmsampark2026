import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { AppError } from '../utils/errors.js';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(validationError(result.error));
    }
    req.body = result.data;
    next();
  };
}

export function validationError(error: ZodError): AppError {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return new AppError(400, 'Please correct the highlighted fields', 'VALIDATION_ERROR', details);
}

export function rejectQueryOperators(value: unknown, path = 'body'): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectQueryOperators(item, `${path}.${index}`));
    return;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      throw new AppError(400, 'Unsupported field name', 'INVALID_INPUT');
    }
    rejectQueryOperators((value as Record<string, unknown>)[key], `${path}.${key}`);
  }
}
