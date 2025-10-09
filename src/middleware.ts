import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin-only routes
    if (pathname.startsWith("/dashboard/account-management")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Redirect to verification page if email not verified
    if (pathname.startsWith("/dashboard") && !token?.emailVerified) {
      return NextResponse.redirect(new URL("/verify", req.url));
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
  ],
};
