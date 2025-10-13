import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

// GET /api/contractors - Get list of available contractors (ADMIN users)
export async function GET() {
  try {
    const { error } = await requireAuth();

    if (error) {
      return error;
    }

    // Allow both CLIENT and ADMIN to view contractors
    // CLIENT can see contractors to request quotes
    // ADMIN can see other contractors for management

    // Get all ADMIN users (contractors)
    const contractors = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        created_at: true,
        _count: {
          select: {
            contractorProjects: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform to include contractor info
    const contractorList = contractors.map((contractor) => ({
      id: contractor.id,
      firstName: contractor.firstName,
      lastName: contractor.lastName,
      email: contractor.email,
      companyName: `${contractor.firstName} ${contractor.lastName} Roofing`, // Default company name
      completedProjects: contractor._count.contractorProjects,
      joinedDate: contractor.created_at,
    }));

    return NextResponse.json({
      success: true,
      contractors: contractorList,
    });
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
      { status: 500 }
    );
  }
}
