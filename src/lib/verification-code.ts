import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;

export async function generateCode(): Promise<string> {
  // 6-digit numeric code
  return crypto.randomInt(100000, 1000000).toString();
}

export async function createVerificationCode(
  email: string,
  type: "email_verification" | "password_reset" = "email_verification"
) {
  // invalidate previous unused codes for this email+type
  await prisma.verificationCode.updateMany({
    where: { email, type, used: false },
    data: { used: true },
  });

  const code = await generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationCode.create({
    data: { email, code, type, expiresAt },
  });

  return { code, expiresAt };
}

export async function verifyCode(
  email: string,
  code: string,
  type: "email_verification" | "password_reset" = "email_verification"
) {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });
  return true;
}

export async function cleanupExpiredCodes() {
  const result = await prisma.verificationCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
