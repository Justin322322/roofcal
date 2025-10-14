import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

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
      include: { user_project_clientIdTouser: true }
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
      },
    });

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

