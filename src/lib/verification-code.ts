import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { isRateLimited, recordOTPAttempt } from "@/lib/rate-limiter";

const OTP_EXPIRY_MINUTES = 10;

export async function generateCode(): Promise<string> {
  // 6-digit numeric code
  return crypto.randomInt(100000, 1000000).toString();
}

export async function createVerificationCode(
  email: string,
  type: "email_verification" | "password_reset" = "email_verification",
  tx?: Prisma.TransactionClient
) {
  // Check rate limiting before generating OTP
  const rateLimitCheck = await isRateLimited(email, "otp_generation");

  if (rateLimitCheck.isLimited) {
    const error = new Error(
      "Rate limit exceeded. Please wait before requesting another code."
    ) as Error & {
      code: string;
      remainingTime?: number;
    };
    error.code = "RATE_LIMIT_EXCEEDED";
    error.remainingTime = rateLimitCheck.remainingTime;
    throw error;
  }

  const client = tx ?? prisma;

  // Record the OTP generation attempt
  await recordOTPAttempt(email, "otp_generation", client);

  // invalidate previous unused codes for this email+type
  await client.verificationcode.updateMany({
    where: { email, type, used: false },
    data: { used: true },
  });

  const code = await generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await client.verificationcode.create({
    data: { id: crypto.randomUUID(), email, code, type, expiresAt },
  });

  return { code, expiresAt };
}

export async function verifyCode(
  email: string,
  code: string,
  type: "email_verification" | "password_reset" = "email_verification"
) {
  const record = await prisma.verificationcode.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.verificationcode.update({
    where: { id: record.id },
    data: { used: true },
  });
  return true;
}

export async function cleanupExpiredCodes() {
  const result = await prisma.verificationcode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
