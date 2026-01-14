// ABOUTME: Custom decorator to extract companyId from the X-Company-Id header.
// ABOUTME: Used in controllers to get the company ID for multi-tenant data filtering from BFF.

import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const CompanyContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('X-Company-Id header is required');
    }

    return companyId;
  },
);
