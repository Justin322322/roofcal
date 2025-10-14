import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// PUT /api/projects/[id]/approve - Approve or reject a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action } = await request.json(); // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the project
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id, // Only the project owner can approve/reject
      },
      include: {
        user_project_userIdTouser: true, // Project owner
        user_project_contractorIdTouser: true, // Admin who created it
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    // Only projects with CLIENT_PENDING status can be approved/rejected
    if (project.status !== "CLIENT_PENDING") {
      return NextResponse.json(
        { success: false, error: "Project is not pending approval" },
        { status: 400 }
      );
    }

    // Update project status
    const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
    
    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    // Create notification for the admin who created the project
    if (project.user_project_contractorIdTouser) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: project.user_project_contractorIdTouser.id,
          type: action === "approve" ? "PROJECT_APPROVED" : "PROJECT_REJECTED",
          title: action === "approve" ? "Project Approved" : "Project Rejected",
          message: action === "approve" 
            ? `${project.projectName} has been approved by ${project.user_project_userIdTouser.firstName} ${project.user_project_userIdTouser.lastName}`
            : `${project.projectName} has been rejected by ${project.user_project_userIdTouser.firstName} ${project.user_project_userIdTouser.lastName}`,
          projectId: project.id,
          projectName: project.projectName,
          actionUrl: `/dashboard?tab=contractor-projects`,
          read: false,
          created_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: action === "approve" ? "Project approved successfully" : "Project rejected successfully",
    });

  } catch (error) {
    console.error("Error updating project approval:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update project approval" },
      { status: 500 }
    );
  }
}