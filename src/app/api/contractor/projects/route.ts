import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET /api/contractor/projects - Fetch all projects assigned to contractor (admin)
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();

    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      contractorId: session!.user.id,
    };

    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { material: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        user_project_clientIdTouser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        user_project_userIdTouser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { created_at: "desc" },
      ],
    });

    // Convert Decimal fields to numbers for JSON response
    const formattedProjects = projects.map(project => ({
      ...project,
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
      latitude: project.latitude ? Number(project.latitude) : null,
      longitude: project.longitude ? Number(project.longitude) : null,
      deliveryCost: project.deliveryCost ? Number(project.deliveryCost) : null,
      deliveryDistance: project.deliveryDistance ? Number(project.deliveryDistance) : null,
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      total: formattedProjects.length,
    });
  } catch (error) {
    console.error("Error fetching contractor projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
