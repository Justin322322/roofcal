import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/verification-code";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { email, code } = schema.parse(body);

  const ok = await verifyCode(email, code, "email_verification");
  if (!ok)
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 }
    );

  const user = await prisma.user.update({
    where: { email },
    data: { email_verified: new Date() },
    select: { id: true },
  });

  // Log email verification activity
  try {
    await prisma.activity.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "EMAIL_VERIFIED",
        description: "Email address verified successfully",
        metadata: JSON.stringify({
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error("Failed to log email verification activity:", error);
  }

  return new NextResponse(null, { status: 204 });
}
