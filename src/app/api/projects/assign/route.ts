import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";
import { notifyProjectAssigned } from "@/lib/notifications";

// POST /api/projects/assign - Assign a project to a contractor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, contractorId } = body;

    if (!projectId || !contractorId) {
      return NextResponse.json(
        { error: "Project ID and Contractor ID are required" },
        { status: 400 }
      );
    }

    // Verify the project exists and user owns it
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id, // Only project owner can assign it
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Verify the contractor exists
    const contractor = await prisma.user.findFirst({
      where: {
        id: contractorId,
        role: UserRole.ADMIN, // Must be a contractor
      },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    // Check if project is already assigned
    if (project.contractorId) {
      return NextResponse.json(
        { error: "Project is already assigned to a contractor" },
        { status: 400 }
      );
    }

    // Assign the project to the contractor
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        contractorId: contractorId,
        clientId: session.user.id, // Set the current user as the client
        assignedAt: new Date(),
        status: "CLIENT_PENDING", // Set status to pending contractor review
        proposalStatus: "DRAFT",
      },
    });

    // Send notification to contractor about the new assignment
    await notifyProjectAssigned(
      projectId,
      updatedProject.projectName,
      session.user.id,
      session.user.name || "Client",
      contractorId,
      `${contractor.firstName} ${contractor.lastName}`,
      contractor.email
    );

    return NextResponse.json({
      message: "Project assigned successfully",
      project: {
        ...updatedProject,
        // Convert Decimal to number for JSON response
        length: Number(updatedProject.length),
        width: Number(updatedProject.width),
        pitch: Number(updatedProject.pitch),
        budgetAmount: updatedProject.budgetAmount ? Number(updatedProject.budgetAmount) : undefined,
        gutterLengthA: updatedProject.gutterLengthA ? Number(updatedProject.gutterLengthA) : undefined,
        gutterSlope: updatedProject.gutterSlope ? Number(updatedProject.gutterSlope) : undefined,
        gutterLengthC: updatedProject.gutterLengthC ? Number(updatedProject.gutterLengthC) : undefined,
        area: Number(updatedProject.area),
        materialCost: Number(updatedProject.materialCost),
        gutterCost: Number(updatedProject.gutterCost),
        ridgeCost: Number(updatedProject.ridgeCost),
        screwsCost: Number(updatedProject.screwsCost),
        insulationCost: Number(updatedProject.insulationCost),
        ventilationCost: Number(updatedProject.ventilationCost),
        totalMaterialsCost: Number(updatedProject.totalMaterialsCost),
        laborCost: Number(updatedProject.laborCost),
        removalCost: Number(updatedProject.removalCost),
        totalCost: Number(updatedProject.totalCost),
        ridgeLength: Number(updatedProject.ridgeLength),
      },
    });
  } catch (error) {
    console.error("Error assigning project:", error);
    return NextResponse.json(
      { error: "Failed to assign project" },
      { status: 500 }
    );
  }
}
