// ABOUTME: Custom decorator to specify required roles for accessing an endpoint.
// ABOUTME: Used with RolesGuard to implement role-based access control on controllers/routes.

import { SetMetadata } from '@nestjs/common';
import { Role } from '../enum/Role';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
