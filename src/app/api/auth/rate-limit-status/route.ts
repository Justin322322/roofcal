import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limiter";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";

const schema = z.object({ email: z.string().email() });


export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email } = schema.parse(body);

    // Verify the user can only check their own rate limit
    if (session.user.email !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimitStatus = await isRateLimited(email, "otp_generation");

    return NextResponse.json(
      {
        isLimited: rateLimitStatus.isLimited,
        remainingTime: rateLimitStatus.remainingTime,
        attemptsRemaining: rateLimitStatus.attemptsRemaining,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors as 400 Bad Request
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors as 400 Bad Request
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Log and return 500 for unexpected server errors
    console.error("Error checking rate limit status:", error);
    return NextResponse.json(
      { error: "Failed to check rate limit status" },
      { status: 500 }
    );
  }
}
