// ABOUTME: Guard that checks if the user has one of the required roles for accessing an endpoint.
// ABOUTME: Works with @Roles() decorator to implement role-based access control.

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/Roles';
import { Role } from '../enum/Role';
import { AuthenticatedRequest } from '../interface/AuthenticatedRequest';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.some((role) => user.role === (role as string));
  }
}
