import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { notifyProjectCompleted } from "@/lib/notifications";

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({ 
      where: { id },
      include: { 
        user_project_clientIdTouser: true,
        user_project_contractorIdTouser: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is the assigned contractor
    if (project.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update project status to COMPLETED
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "COMPLETED",
        contractorStatus: "completed",
        proposalStatus: "COMPLETED", // Also update proposal status
      },
    });

    // Send notification to client
    if (project.user_project_clientIdTouser) {
      const client = project.user_project_clientIdTouser;
      const contractor = project.user_project_contractorIdTouser;
      
      try {
        await notifyProjectCompleted(
          id,
          project.projectName,
          session.user.id,
          contractor ? `${contractor.firstName} ${contractor.lastName}` : "Contractor",
          client.id,
          `${client.firstName} ${client.lastName}`,
          client.email
        );
      } catch (notificationError) {
        console.error("Failed to send completion notification:", notificationError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Project completed successfully",
      project: updatedProject 
    });
  } catch (error) {
    console.error("Error finishing project:", error);
    return NextResponse.json({ error: "Failed to finish project" }, { status: 500 });
  }
}

