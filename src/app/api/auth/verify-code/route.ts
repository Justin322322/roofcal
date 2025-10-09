import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/verification-code";
import { z } from "zod";

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

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });
  return new NextResponse(null, { status: 204 });
}
