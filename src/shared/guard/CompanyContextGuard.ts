// ABOUTME: Guard that extracts and validates the companyId from the JWT token.
// ABOUTME: Ensures multi-tenant isolation by setting companyId on the request for downstream use.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../interface/AuthenticatedRequest';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.companyId) {
      throw new UnauthorizedException('No company context available');
    }

    request.companyId = user.companyId;
    return true;
  }
}
