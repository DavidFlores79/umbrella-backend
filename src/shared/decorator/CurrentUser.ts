// ABOUTME: Custom decorator to extract the current authenticated user from the request.
// ABOUTME: Used in controllers to access the authenticated user's information.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  sub: string;
  companyId: string;
  role: string;
  permissions: string[];
  email?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
