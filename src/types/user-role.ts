/**
 * User role enumeration
 * Defines the available user roles in the application
 */
export enum UserRole {
  CLIENT = "CLIENT",
  ADMIN = "ADMIN",
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
    default:
      return "Unknown";
  }
}

/**
 * Check if a user role has permission for a required role
 * Uses a hierarchy where ADMIN has higher privileges than CLIENT
 */
export function hasRolePermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy = {
    [UserRole.CLIENT]: 0,
    [UserRole.ADMIN]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
