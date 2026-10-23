export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = 'Not found'): AppError {
  return new AppError(404, message, 'NOT_FOUND');
}

export function forbidden(message = 'You do not have access to this resource'): AppError {
  return new AppError(403, message, 'FORBIDDEN');
}
