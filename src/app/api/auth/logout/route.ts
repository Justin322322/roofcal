import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { validateCSRFToken, clearCSRFTokenCookie } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import crypto from "crypto";


export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    logger.api("logout", "starting_process");

    // CSRF Protection: Validate CSRF token before proceeding
    const isValidCSRF = await validateCSRFToken(request);
    if (!isValidCSRF) {
      logger.api("logout", "csrf_validation_failed");
      return NextResponse.json(
        { error: "CSRF token validation failed" },
        { status: 403 }
      );
    }

    logger.api("logout", "csrf_validated");

    // Try to get session from headers (cookies)
    const session = await getServerSession(authOptions);

    if (!session) {
      logger.api("logout", "no_session_found");
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    logger.auth(
      "session_found",
      "logout_process",
      session.user?.id,
      session.user?.email
    );

    // Log logout activity (non-blocking)
    if (session.user?.id) {
      prisma.activity
        .create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user.id,
            type: "LOGOUT",
            description: "User logged out successfully",
            metadata: JSON.stringify({
              userId: session.user.id,
              timestamp: new Date().toISOString(),
            }),
          },
        })
        .then((activity) => {
          logger.log(
            "info",
            "Logout activity recorded",
            `activity_id:${activity.id}`
          );
        })
        .catch((dbError) => {
          logger.log(
            "error",
            "Failed to create logout activity",
            dbError instanceof Error ? dbError.message : String(dbError)
          );
          // Don't fail the entire logout if activity recording fails
          // Just log the error and continue
        });
    } else {
      logger.log("warn", "No user ID in session", "logout_activity_skipped");
    }

    // Clear CSRF token cookie after successful logout
    await clearCSRFTokenCookie();

    // Create response with session invalidation
    const response = NextResponse.json({
      message: "Logged out successfully",
      success: true,
    });

    // Clear the NextAuth session cookie
    // This is the critical part that was missing - clearing the actual session
    response.cookies.set({
      name: "next-auth.session-token",
      value: "",
      expires: new Date(0), // Set to past date to delete
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Also clear the secure version for HTTPS environments
    response.cookies.set({
      name: "__Secure-next-auth.session-token",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    logger.api("logout", "completed_successfully");
    return response;
  } catch (error) {
    logger.log(
      "error",
      "Logout API error",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
