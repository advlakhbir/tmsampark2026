import type { Request } from 'express';
import { AuditLog } from '../models/index.js';

export async function writeAudit(
  req: Pick<Request, 'user' | 'ip' | 'requestId'> | { user?: Request['user']; ip?: string; requestId?: string },
  action: string,
  entityType: string,
  entityId: unknown,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await AuditLog.create({
    actorId: req.user?.id,
    action,
    entityType,
    entityId: entityId ? String(entityId) : '',
    metadata,
    ip: req.ip || '',
    requestId: req.requestId || '',
  });
}
