import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/reset-token";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { token, newPassword } = schema.parse(body);

  // Verify the reset token
  const decodedToken = verifyResetToken(token);
  if (!decodedToken) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  const { email } = decodedToken;

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found with this email address" },
      { status: 404 }
    );
  }

  // Update user password
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  return new NextResponse(null, { status: 204 });
}
