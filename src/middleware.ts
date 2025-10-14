import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/user-role";
import { getMaintenanceStatus } from "@/lib/maintenance-utils";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Check maintenance mode - allow DEVELOPER to bypass
    if (token?.role !== UserRole.DEVELOPER) {
      const maintenanceStatus = await getMaintenanceStatus();
      
      if (maintenanceStatus.maintenanceMode) {
        // Allow access to maintenance page and auth pages
        if (
          pathname === "/maintenance" ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") ||
          pathname.startsWith("/verify") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/reset-password")
        ) {
          // Allow access to these pages
        } else {
          // Redirect to maintenance page
          return NextResponse.redirect(new URL("/maintenance", req.url));
        }
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
        // Allow access to auth pages without token
        if (
          req.nextUrl.pathname.startsWith("/login") ||
          req.nextUrl.pathname.startsWith("/signup") ||
          req.nextUrl.pathname.startsWith("/verify") ||
          req.nextUrl.pathname.startsWith("/forgot-password") ||
          req.nextUrl.pathname.startsWith("/reset-password")
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
  ],
};
