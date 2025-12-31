// ABOUTME: Custom decorator to extract the current authenticated user from the request.
// ABOUTME: Used in controllers to access the authenticated user's information.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  UserPayload,
} from '../interface/AuthenticatedRequest';

export type CurrentUserPayload = UserPayload;

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
