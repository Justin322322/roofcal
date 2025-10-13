import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return error for non-existing emails
    return NextResponse.json(
      { error: "No account found with this email address" },
      { status: 404 }
    );
  }

  // Generate JWT reset token
  const resetToken = generateResetToken(email);

  // Create reset URL
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  // Send email with reset link
  const emailResult = await sendPasswordResetEmail(email, resetUrl);

  if (!emailResult.success) {
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Password reset link sent to your email" },
    { status: 200 }
  );
}
