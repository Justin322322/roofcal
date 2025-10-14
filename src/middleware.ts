import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/user-role";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

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
  ],
};
