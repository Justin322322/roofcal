import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a DEVELOPER
    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    // Fetch all users (excluding sensitive data)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isDisabled: true,
        passwordChangeRequired: true,
        created_at: true,
      },
      orderBy: [
        { role: "asc" },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
