// ABOUTME: Custom decorator to extract companyId from the request context.
// ABOUTME: Used in controllers to get the current user's company ID for multi-tenant data filtering.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interface/AuthenticatedRequest';

export const CompanyContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.companyId ?? '';
  },
);
