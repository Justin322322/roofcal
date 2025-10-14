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

    // Update project status to CONTRACTOR_REVIEWING
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "CONTRACTOR_REVIEWING",
        contractorStatus: "reviewing",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Project approved and moved to review",
      project: updatedProject 
    });
  } catch (error) {
    console.error("Error approving project:", error);
    return NextResponse.json({ error: "Failed to approve project" }, { status: 500 });
  }
}

