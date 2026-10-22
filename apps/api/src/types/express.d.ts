import type { Permission, Role } from '@tmsampark/shared';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
        customerId?: string;
        permissions: Permission[] | ['*'];
      };
      sessionId?: string;
    }
  }
}

export {};
