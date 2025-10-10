import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { generateAndSetCSRFToken } from "@/lib/csrf";

/**
 * GET /api/csrf-token
 * Returns a CSRF token for authenticated users
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Generate and set CSRF token
    const token = await generateAndSetCSRFToken();

    return NextResponse.json({
      csrfToken: token,
      success: true,
    });
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
