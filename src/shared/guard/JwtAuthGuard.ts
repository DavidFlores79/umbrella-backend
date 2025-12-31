// ABOUTME: Guard that validates JWT tokens and extracts user information.
// ABOUTME: Protects endpoints requiring authentication by verifying the Bearer token.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';

interface JwtPayload {
  sub: string;
  companyId: string;
  role: string;
  permissions: string[];
  email?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_PRIVATE_KEY'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
      });

      request.user = {
        sub: payload.sub,
        companyId: payload.companyId,
        role: payload.role,
        permissions: payload.permissions || [],
        email: payload.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
