import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";

/**
 * Check if the current user is authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
      session: null,
    };
  }
  
  return {
    error: null,
    session,
  };
}

/**
 * Check if the current user has admin role
 */
export async function requireAdmin() {
  const { error, session } = await requireAuth();
  
  if (error) {
    return { error, session: null };
  }
  
  if (session?.user?.role !== UserRole.ADMIN) {
    return {
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
      session: null,
    };
  }
  
  return {
    error: null,
    session,
  };
}

/**
 * Check if the current user has client role
 */
export async function requireClient() {
  const { error, session } = await requireAuth();
  
  if (error) {
    return { error, session: null };
  }
  
  if (session?.user?.role !== UserRole.CLIENT) {
    return {
      error: NextResponse.json(
        { error: "Client access required" },
        { status: 403 }
      ),
      session: null,
    };
  }
  
  return {
    error: null,
    session,
  };
}

/**
 * Check if the current user has any of the specified roles
 */
export async function requireRole(roles: UserRole[]) {
  const { error, session } = await requireAuth();
  
  if (error) {
    return { error, session: null };
  }
  
  if (!session?.user?.role || !roles.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
      session: null,
    };
  }
  
  return {
    error: null,
    session,
  };
}