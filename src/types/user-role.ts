/**
 * User role enumeration
 * Defines the available user roles in the application
 */
export enum UserRole {
  CLIENT = "CLIENT",
  ADMIN = "ADMIN",
  DEVELOPER = "DEVELOPER",
}

/**
 * Type guard to check if a string is a valid user role
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get the display name for a user role
 */
export function getUserRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.CLIENT:
      return "Client";
    case UserRole.ADMIN:
      return "Administrator";
    case UserRole.DEVELOPER:
      return "Developer";
    default:
      return "Unknown";
  }
}

/**
 * Check if a user role has permission for a required role
 * Uses a hierarchy where DEVELOPER has highest privileges, followed by ADMIN, then CLIENT
 */
export function hasRolePermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy = {
    [UserRole.CLIENT]: 0,
    [UserRole.ADMIN]: 1,
    [UserRole.DEVELOPER]: 2,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
