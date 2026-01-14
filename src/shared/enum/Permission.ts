// ABOUTME: Defines all available permissions in the system for granular access control.
// ABOUTME: Permissions are assigned to users and checked by PermissionsGuard on protected endpoints.

export enum Permission {
  // Company permissions
  COMPANIES_READ = 'companies:read',
  COMPANIES_WRITE = 'companies:write',
  COMPANIES_DELETE = 'companies:delete',

  // User permissions
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',

  // Product permissions
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',

  // Client permissions
  CLIENTS_READ = 'clients:read',
  CLIENTS_WRITE = 'clients:write',
  CLIENTS_DELETE = 'clients:delete',

  // Vendor permissions
  VENDORS_READ = 'vendors:read',
  VENDORS_WRITE = 'vendors:write',
  VENDORS_DELETE = 'vendors:delete',

  // Sales permissions
  SALES_READ = 'sales:read',
  SALES_WRITE = 'sales:write',
  SALES_DELETE = 'sales:delete',

  // Purchases permissions
  PURCHASES_READ = 'purchases:read',
  PURCHASES_WRITE = 'purchases:write',
  PURCHASES_DELETE = 'purchases:delete',

  // Inventory permissions
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',
  INVENTORY_DELETE = 'inventory:delete',

  // Installations permissions
  INSTALLATIONS_READ = 'installations:read',
  INSTALLATIONS_WRITE = 'installations:write',
  INSTALLATIONS_DELETE = 'installations:delete',

  // Reports permissions
  REPORTS_READ = 'reports:read',
  REPORTS_EXPORT = 'reports:export',

  // Dashboard permissions
  DASHBOARD_READ = 'dashboard:read',
}

/**
 * Default permissions for each role
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, Permission[]> = {
  admin: Object.values(Permission),
  manager: [
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.PRODUCTS_DELETE,
    Permission.CLIENTS_READ,
    Permission.CLIENTS_WRITE,
    Permission.CLIENTS_DELETE,
    Permission.VENDORS_READ,
    Permission.VENDORS_WRITE,
    Permission.VENDORS_DELETE,
    Permission.SALES_READ,
    Permission.SALES_WRITE,
    Permission.SALES_DELETE,
    Permission.PURCHASES_READ,
    Permission.PURCHASES_WRITE,
    Permission.PURCHASES_DELETE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.INVENTORY_DELETE,
    Permission.INSTALLATIONS_READ,
    Permission.INSTALLATIONS_WRITE,
    Permission.INSTALLATIONS_DELETE,
    Permission.REPORTS_READ,
    Permission.REPORTS_EXPORT,
    Permission.DASHBOARD_READ,
  ],
  user: [
    Permission.PRODUCTS_READ,
    Permission.CLIENTS_READ,
    Permission.VENDORS_READ,
    Permission.SALES_READ,
    Permission.PURCHASES_READ,
    Permission.INVENTORY_READ,
    Permission.INSTALLATIONS_READ,
    Permission.DASHBOARD_READ,
  ],
};
