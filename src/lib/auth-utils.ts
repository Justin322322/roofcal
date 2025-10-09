import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
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

export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    client: 0,
    admin: 1,
  };

  return (
    roleHierarchy[userRole as keyof typeof roleHierarchy] >=
    roleHierarchy[requiredRole as keyof typeof roleHierarchy]
  );
}
