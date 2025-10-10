import { NextResponse } from "next/server";
import { createVerificationCode } from "@/lib/verification-code";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);

  try {
    const { code, expiresAt } = await createVerificationCode(
      email,
      "email_verification"
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code);
    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ expiresAt }, { status: 200 });
  } catch (error: unknown) {
    // Handle rate limiting errors
    const rateLimitError = error as Error & {
      code?: string;
      remainingTime?: number;
    };

    if (rateLimitError.code === "RATE_LIMIT_EXCEEDED") {
      const remainingTime = rateLimitError.remainingTime || 30;
      return NextResponse.json(
        {
          error:
            "Too many requests. Please wait before requesting another code.",
          code: "RATE_LIMIT_EXCEEDED",
          remainingTime,
        },
        { status: 429 }
      );
    }

    // Handle other errors
    console.error("Error generating verification code:", error);
    return NextResponse.json(
      { error: "Failed to generate verification code" },
      { status: 500 }
    );
  }
}
