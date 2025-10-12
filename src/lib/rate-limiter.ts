import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

/**
 * OTP rate limiting configuration
 */
const OTP_COOLDOWN_SECONDS = 30;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_ATTEMPTS_PER_WINDOW = 3;

/**
 * Rate limit entry for tracking OTP generation attempts
 */
export interface RateLimitEntry {
  id: string;
  email: string;
  action: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if an email is currently rate limited for OTP generation
 */
export async function isRateLimited(
  email: string,
  action: string = "otp_generation"
): Promise<{
  isLimited: boolean;
  remainingTime?: number;
  attemptsRemaining?: number;
}> {
  try {
    const now = new Date();

    // Clean up old rate limit entries (older than 24 hours)
    await prisma.ratelimit.deleteMany({
      where: {
        created_at: {
          lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Find existing rate limit entry
    const existingEntry = await prisma.ratelimit.findFirst({
      where: {
        email,
        action,
        created_at: {
          gte: new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000),
        },
      },
    });

    if (!existingEntry) {
      return { isLimited: false, attemptsRemaining: MAX_ATTEMPTS_PER_WINDOW };
    }

    // Check if currently blocked due to cooldown
    if (existingEntry.blockedUntil && existingEntry.blockedUntil > now) {
      const remainingTime = Math.ceil(
        (existingEntry.blockedUntil.getTime() - now.getTime()) / 1000
      );
      return { isLimited: true, remainingTime };
    }

    // Check if exceeded max attempts in window
    if (existingEntry.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
      // Block for the rest of the window
      const windowEnd = new Date(
        existingEntry.created_at.getTime() +
          RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
      );
      await prisma.ratelimit.update({
        where: { id: existingEntry.id },
        data: { blockedUntil: windowEnd },
      });

      const remainingTime = Math.ceil(
        (windowEnd.getTime() - now.getTime()) / 1000
      );
      return { isLimited: true, remainingTime };
    }

    return {
      isLimited: false,
      attemptsRemaining: MAX_ATTEMPTS_PER_WINDOW - existingEntry.attempts,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // On error, allow the request but log it
    return { isLimited: false };
  }
}

/**
 * Record an OTP generation attempt
 */
export async function recordOTPAttempt(
  email: string,
  action: string = "otp_generation",
  tx?: Prisma.TransactionClient
): Promise<void> {
  try {
    const now = new Date();
    const client = tx ?? prisma;

    // Use upsert to handle both create and update cases
    // This prevents the unique constraint error
    await client.ratelimit.upsert({
      where: {
        email_action: {
          email,
          action,
        },
      },
      update: {
        attempts: { increment: 1 },
        lastAttempt: now,
        updated_at: now,
        // Update blockedUntil only if it's not already set or if the new block is later
        blockedUntil: {
          set: new Date(now.getTime() + OTP_COOLDOWN_SECONDS * 1000),
        },
      },
      create: {
        id: crypto.randomUUID(),
        email,
        action,
        attempts: 1,
        lastAttempt: now,
        blockedUntil: new Date(now.getTime() + OTP_COOLDOWN_SECONDS * 1000),
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error("Error recording OTP attempt:", error);
    // Don't throw error to avoid breaking the OTP generation flow
  }
}

/**
 * Get the remaining cooldown time for an email
 */
export async function getCooldownRemaining(
  email: string,
  action: string = "otp_generation"
): Promise<number> {
  try {
    const now = new Date();

    const entry = await prisma.ratelimit.findFirst({
      where: {
        email,
        action,
        blockedUntil: {
          gt: now,
        },
      },
    });

    if (!entry || !entry.blockedUntil) {
      return 0;
    }

    return Math.max(
      0,
      Math.ceil((entry.blockedUntil.getTime() - now.getTime()) / 1000)
    );
  } catch (error) {
    console.error("Error getting cooldown remaining:", error);
    return 0;
  }
}

/**
 * Clear rate limit for an email (admin function)
 */
export async function clearRateLimit(
  email: string,
  action: string = "otp_generation"
): Promise<void> {
  try {
    await prisma.ratelimit.deleteMany({
      where: { email, action },
    });
  } catch (error) {
    console.error("Error clearing rate limit:", error);
    throw error;
  }
}
