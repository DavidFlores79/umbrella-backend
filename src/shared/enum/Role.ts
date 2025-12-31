// ABOUTME: Defines the user role enum for role-based access control (RBAC).
// ABOUTME: Used in conjunction with RolesGuard to protect endpoints based on user roles.

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}
