import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { createVerificationCode } from "@/lib/verification-code";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = schema.parse(body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing)
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: { id: true, email: true },
  });

  const { expiresAt } = await createVerificationCode(
    user.email,
    "email_verification"
  );
  // TODO: send email with code

  return NextResponse.json(
    { id: user.id, email: user.email, expiresAt },
    { status: 201 }
  );
}
