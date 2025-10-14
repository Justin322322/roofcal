import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// DELETE /api/projects/[id]/permanent-delete - Permanently delete an archived project
export async function DELETE(
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

    // Verify the project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: 'ARCHIVED', // Only allow permanent deletion of archived projects
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Archived project not found" },
        { status: 404 }
      );
    }

    // Permanently delete the project and all related data
    await prisma.project.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project permanently deleted",
    });
  } catch (error) {
    console.error("Error permanently deleting project:", error);
    return NextResponse.json(
      { success: false, error: "Failed to permanently delete project" },
      { status: 500 }
    );
  }
}

