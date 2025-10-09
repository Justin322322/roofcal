import { NextResponse } from "next/server";
import { createVerificationCode } from "@/lib/verification-code";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);

  const { expiresAt } = await createVerificationCode(
    email,
    "email_verification"
  );
  // TODO: send email with code

  return NextResponse.json({ expiresAt }, { status: 200 });
}
