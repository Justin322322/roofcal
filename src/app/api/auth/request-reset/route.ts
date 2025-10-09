import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationCode } from "@/lib/verification-code";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists or not for security
    return NextResponse.json(
      { message: "If the email exists, a reset code has been sent" },
      { status: 200 }
    );
  }

  // Create password reset code
  const { expiresAt } = await createVerificationCode(email, "password_reset");
  // TODO: send email with reset code

  return NextResponse.json(
    { message: "Reset code sent to your email", expiresAt },
    { status: 200 }
  );
}
