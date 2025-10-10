import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { createVerificationCode } from "@/lib/verification-code";
import { sendVerificationEmail } from "@/lib/email";
import { validatePassword } from "@/lib/password-validator";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = schema.parse(body);

  // Validate password strength on backend
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    return NextResponse.json(
      { error: passwordValidation.message },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing)
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );

  const passwordHash = await bcrypt.hash(data.password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        updated_at: new Date(),
      },
      select: { id: true, email: true },
    });

    await tx.activity.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "ACCOUNT_CREATED",
        description: "Account created successfully",
        metadata: JSON.stringify({
          email: user.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      },
    });

    const { code, expiresAt } = await createVerificationCode(
      user.email,
      "email_verification",
      tx
    );

    return { user, code, expiresAt };
  });

  // Send verification email after the transaction has committed.
  // Do not throw if email fails; log and continue.
  try {
    const emailResult = await sendVerificationEmail(
      result.user.email,
      result.code
    );
    if (!emailResult.success) {
      console.error(
        "Failed to send verification email for user:",
        result.user.email
      );
    }
  } catch (err) {
    console.error("Error while sending verification email:", err);
  }

  return NextResponse.json(
    {
      id: result.user.id,
      email: result.user.email,
      expiresAt: result.expiresAt,
    },
    { status: 201 }
  );
}
