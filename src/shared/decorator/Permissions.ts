// ABOUTME: Custom decorator to specify required permissions for accessing an endpoint.
// ABOUTME: Used with PermissionsGuard to implement fine-grained access control on controllers/routes.

import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enum/Permission';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
