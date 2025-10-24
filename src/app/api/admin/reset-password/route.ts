import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { validatePassword } from "@/lib/password-validator";
import { sendPasswordResetNotificationEmail } from "@/lib/email";

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  requirePasswordChange: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a DEVELOPER
    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, newPassword, requirePasswordChange } = resetPasswordSchema.parse(body);

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password does not meet security requirements" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent resetting password for other DEVELOPER accounts
    if (targetUser.role === "DEVELOPER" && targetUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot reset password for other developer accounts" },
        { status: 403 }
      );
    }

    // Log the plain text password before hashing (for developer reference)
    console.log("=".repeat(80));
    console.log("PASSWORD RESET - DEVELOPER REFERENCE");
    console.log("=".repeat(80));
    console.log(`User: ${targetUser.firstName} ${targetUser.lastName}`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Role: ${targetUser.role}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`Require Password Change: ${requirePasswordChange}`);
    console.log(`Reset By: ${session.user.email}`);
    console.log(`Reset At: ${new Date().toISOString()}`);
    console.log("=".repeat(80));

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangeRequired: requirePasswordChange,
        updated_at: new Date(),
      },
    });

    // Send email notification to user with new password
    try {
      await sendPasswordResetNotificationEmail(
        targetUser.email,
        targetUser.firstName,
        targetUser.lastName,
        newPassword,
        requirePasswordChange
      );
      console.log(`✓ Password reset email sent to: ${targetUser.email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Continue even if email fails - password was already reset
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: session.user.id,
        type: "PASSWORD_CHANGE",
        description: `Password reset for user: ${targetUser.email} (${targetUser.firstName} ${targetUser.lastName})`,
        metadata: JSON.stringify({
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          targetUserRole: targetUser.role,
          requirePasswordChange,
          resetBy: session.user.email,
          resetAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Password reset error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
