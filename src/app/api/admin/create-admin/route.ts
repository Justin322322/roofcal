import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { sendAdminCredentialsEmail } from "@/lib/email";

const createAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Verify the user is authenticated and has DEVELOPER role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if the user has DEVELOPER role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Insufficient permissions. Only developers can create admin accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, firstName, lastName, password } = createAdminSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the admin user with passwordChangeRequired set to true
    const newAdmin = await prisma.$transaction(async (tx) => {
      const userData = {
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        passwordHash,
        role: "ADMIN" as const,
        passwordChangeRequired: true, // Force password change on first login
        updated_at: new Date(),
      };

      const user = await tx.user.create({
        data: userData,
      });

      // Create activity log
      await tx.activity.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          type: "ACCOUNT_CREATED",
          description: "Admin account created by developer",
          metadata: JSON.stringify({
            email: user.email,
            firstName,
            lastName,
            role: "ADMIN",
            createdAt: new Date().toISOString(),
            createdBy: "developer",
          }),
        },
      });

      return user;
    });

    // Send credentials email to the new admin
    try {
      await sendAdminCredentialsEmail({
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        password,
      });
    } catch (emailError) {
      console.error("Failed to send admin credentials email:", emailError);
      // Don't fail the admin creation if email fails
    }

    return NextResponse.json(
      {
        message: "Admin account created successfully. Credentials have been sent to the admin's email.",
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName,
          role: newAdmin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin account:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
