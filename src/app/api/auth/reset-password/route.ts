import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { verifyCode } from "@/lib/verification-code";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { email, code, newPassword } = schema.parse(body);

  // Verify the reset code first
  const isValidCode = await verifyCode(email, code, "password_reset");
  if (!isValidCode) {
    return NextResponse.json(
      { error: "Invalid or expired reset code" },
      { status: 400 }
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
