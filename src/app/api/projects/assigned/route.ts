import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

// GET /api/projects/assigned - Get projects assigned to the current contractor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only ADMIN (contractors) can access assigned projects
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only contractors can view assigned projects." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause - exclude DRAFT status from admin view as per workflow
    const where: {
      contractorId: string;
      status?: { not: "DRAFT" } | "ACTIVE" | "CLIENT_PENDING" | "CONTRACTOR_REVIEWING" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "REJECTED";
    } = {
      contractorId: session.user.id,
      status: { not: "DRAFT" }, // Exclude DRAFT status for admin view
    };

    if (status && status !== "ALL") {
      // If a specific status is requested, override the DRAFT exclusion
      where.status = status as "ACTIVE" | "CLIENT_PENDING" | "CONTRACTOR_REVIEWING" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "REJECTED";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Get assigned projects with client information
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
        skip,
        take,
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Transform the data to match our interface
    const transformedProjects = projects.map((project) => ({
      ...project,
      // Convert Decimal to number for JSON response
      length: Number(project.length),
      width: Number(project.width),
      pitch: Number(project.pitch),
      budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
      gutterLengthA: project.gutterLengthA ? Number(project.gutterLengthA) : undefined,
      gutterSlope: project.gutterSlope ? Number(project.gutterSlope) : undefined,
      gutterLengthC: project.gutterLengthC ? Number(project.gutterLengthC) : undefined,
      area: Number(project.area),
      materialCost: Number(project.materialCost),
      gutterCost: Number(project.gutterCost),
      ridgeCost: Number(project.ridgeCost),
      screwsCost: Number(project.screwsCost),
      insulationCost: Number(project.insulationCost),
      ventilationCost: Number(project.ventilationCost),
      totalMaterialsCost: Number(project.totalMaterialsCost),
      laborCost: Number(project.laborCost),
      removalCost: Number(project.removalCost),
      totalCost: Number(project.totalCost),
      ridgeLength: Number(project.ridgeLength),
        client: project.client || {
          firstName: "Unknown",
          lastName: "Client",
          email: "unknown@example.com"
        },
    }));

    return NextResponse.json({
      projects: transformedProjects,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned projects" },
      { status: 500 }
    );
  }
}
