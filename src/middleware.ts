import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/user-role";
import type { JWT } from "next-auth/jwt";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token as JWT & { passwordChangeRequired?: boolean };
    const { pathname } = req.nextUrl;

    // Check if user is disabled - this will be handled by JWT callback returning null
    // But we add an extra check here for security
    if (token && pathname.startsWith("/dashboard")) {
      const { prisma } = await import("@/lib/prisma");
      try {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isDisabled: true, passwordChangeRequired: true },
        });
        
        if (user?.isDisabled) {
          // Clear the session and redirect to login
          return NextResponse.redirect(new URL("/login?error=AccountDisabled", req.url));
        }

        // Update token with latest passwordChangeRequired status
        if (user && user.passwordChangeRequired !== token.passwordChangeRequired) {
          token.passwordChangeRequired = user.passwordChangeRequired;
        }
      } catch (error) {
        // If we can't check the user status, allow the request to continue
        // The JWT callback will handle this case
        console.warn("Could not check user disabled status:", error);
      }
    }

    // Developer-only routes
    if (
      pathname.startsWith("/dashboard/database-management") ||
      pathname.startsWith("/dashboard/system-control")
    ) {
      if (token?.role !== UserRole.DEVELOPER) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Admin-only routes
    if (pathname.startsWith("/dashboard/account-management")) {
      if (token?.role !== UserRole.ADMIN && token?.role !== UserRole.DEVELOPER) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Redirect to change password page if password change is required
    if (
      pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/dashboard/change-password") &&
      token &&
      token.passwordChangeRequired
    ) {
      return NextResponse.redirect(new URL("/dashboard/change-password", req.url));
    }

    // Redirect to verification page if email not verified
    if (pathname.startsWith("/dashboard") && token && !token.emailVerified) {
      // Redirect to verification page if user has email but not verified
      if (token.email) {
        const verifyUrl = new URL("/verify", req.url);
        verifyUrl.searchParams.set("email", token.email);
        return NextResponse.redirect(verifyUrl);
      }

      // If no email in token, redirect to login
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and maintenance page without token
        if (
          req.nextUrl.pathname.startsWith("/login") ||
          req.nextUrl.pathname.startsWith("/signup") ||
          req.nextUrl.pathname.startsWith("/verify") ||
          req.nextUrl.pathname.startsWith("/forgot-password") ||
          req.nextUrl.pathname.startsWith("/reset-password") ||
          req.nextUrl.pathname === "/maintenance"
        ) {
          return true;
        }

        // Require token for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/verify",
    "/forgot-password",
    "/reset-password",
    "/maintenance",
    "/dashboard/change-password",
  ],
};
