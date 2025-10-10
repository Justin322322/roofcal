import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { redirect } from "next/navigation";
import { UserRole, hasRolePermission } from "@/types/user-role";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireEmailVerified() {
  const session = await requireAuth();
  if (!session.user.emailVerified) {
    redirect("/verify");
  }
  return session;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return hasRolePermission(userRole, requiredRole);
}
