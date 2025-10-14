import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/projects/archived - List user's archived projects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get archived projects (projects with deletedAt set)
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
      include: {
        user_project_contractorIdTouser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        user_project_clientIdTouser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // Format projects for response
    const formattedProjects = projects.map((project) => ({
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
      // Convert location Decimal fields to number
      latitude: project.latitude ? Number(project.latitude) : null,
      longitude: project.longitude ? Number(project.longitude) : null,
      deliveryCost: project.deliveryCost ? Number(project.deliveryCost) : null,
      deliveryDistance: project.deliveryDistance ? Number(project.deliveryDistance) : null,
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error) {
    console.error("Error fetching archived projects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch archived projects" },
      { status: 500 }
    );
  }
}

