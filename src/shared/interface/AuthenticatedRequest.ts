// ABOUTME: Interface defining the authenticated request structure for multi-tenant access.
// ABOUTME: Contains user payload and company context properties added by auth guards.

import { Request } from 'express';

export interface UserPayload {
  sub: string;
  companyId: string;
  role: string;
  permissions: string[];
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  companyId?: string;
}
