import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { validateWorkflowTransition } from "@/lib/project-workflow";
import { notifyStatusChange } from "@/lib/notifications";
import type { ProjectStatus } from "@/types/project";
import { UserRole } from "@/types/user-role";

// PATCH /api/projects/[id]/status - Update project status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Get the current project with related data
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // Project owner
          { contractorId: session.user.id }, // Assigned contractor
          { clientId: session.user.id }, // Assigned client
        ],
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
        user_project_userIdTouser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Convert Decimal fields to numbers for validation
    const projectForValidation = {
      ...project,
      // Exclude stageProgress as it has JsonValue type from Prisma but needs Record<ProjectStage, boolean>
      stageProgress: undefined,
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
    };

    // Validate the workflow transition
    const validation = validateWorkflowTransition(
      project.status,
      newStatus as ProjectStatus,
      session.user.role as UserRole,
      project.proposalSent !== null,
      projectForValidation
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Update the project status
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: newStatus as ProjectStatus,
        // Apply auto-updates if specified in validation
        ...(validation.autoUpdates?.proposalStatus && {
          proposalStatus: validation.autoUpdates.proposalStatus,
        }),
      },
    });

    // Send notifications to relevant parties
    const currentUser = session.user.name || "User";
    
    // Notify client if contractor changed status
    if (session.user.role === UserRole.ADMIN && project.user_project_clientIdTouser) {
      await notifyStatusChange(
        id,
        project.projectName,
        newStatus,
        session.user.id,
        currentUser,
        project.user_project_clientIdTouser.id,
        `${project.user_project_clientIdTouser.firstName} ${project.user_project_clientIdTouser.lastName}`,
        project.user_project_clientIdTouser.email
      );
    }

    // Notify contractor if client changed status
    if (session.user.role === UserRole.CLIENT && project.user_project_contractorIdTouser) {
      await notifyStatusChange(
        id,
        project.projectName,
        newStatus,
        session.user.id,
        currentUser,
        project.user_project_contractorIdTouser.id,
        `${project.user_project_contractorIdTouser.firstName} ${project.user_project_contractorIdTouser.lastName}`,
        project.user_project_contractorIdTouser.email
      );
    }

    // Notify project owner if someone else changed status
    if (session.user.id !== project.userId) {
      await notifyStatusChange(
        id,
        project.projectName,
        newStatus,
        session.user.id,
        currentUser,
        project.userId,
        `${project.user_project_userIdTouser.firstName} ${project.user_project_userIdTouser.lastName}`,
        "" // Email not available in user include
      );
    }

    return NextResponse.json({
      message: "Status updated successfully",
      project: {
        ...updatedProject,
        // Convert Decimal to number for JSON response
        length: Number(updatedProject.length),
        width: Number(updatedProject.width),
        pitch: Number(updatedProject.pitch),
        budgetAmount: updatedProject.budgetAmount
          ? Number(updatedProject.budgetAmount)
          : undefined,
        gutterLengthA: updatedProject.gutterLengthA
          ? Number(updatedProject.gutterLengthA)
          : undefined,
        gutterSlope: updatedProject.gutterSlope
          ? Number(updatedProject.gutterSlope)
          : undefined,
        gutterLengthC: updatedProject.gutterLengthC
          ? Number(updatedProject.gutterLengthC)
          : undefined,
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
        // Convert location Decimal fields to number
        latitude: updatedProject.latitude ? Number(updatedProject.latitude) : null,
        longitude: updatedProject.longitude ? Number(updatedProject.longitude) : null,
        deliveryCost: updatedProject.deliveryCost ? Number(updatedProject.deliveryCost) : null,
        deliveryDistance: updatedProject.deliveryDistance ? Number(updatedProject.deliveryDistance) : null,
      },
    });
  } catch (error) {
    console.error("Error updating project status:", error);
    return NextResponse.json(
      { error: "Failed to update project status" },
      { status: 500 }
    );
  }
}
