import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { getProjectMaterialSummary, returnProjectMaterials } from "@/lib/material-consumption";

export const runtime = 'nodejs';

// GET /api/projects/[id]/materials - Get material consumption summary
export async function GET(
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

    // Check if project exists and user has access to it
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // Project owner
          { contractorId: session.user.id }, // Assigned contractor
          { clientId: session.user.id }, // Assigned client
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const materialSummary = await getProjectMaterialSummary(id);

    return NextResponse.json(materialSummary);
  } catch (error) {
    console.error("Error fetching project materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch project materials" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/materials/return - Manually return materials
export async function POST(
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

    // Check if project exists and user has access to it
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // Project owner
          { contractorId: session.user.id }, // Assigned contractor
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only allow contractors and admins to return materials
    if (session.user.role !== "ADMIN" && project.contractorId !== session.user.id) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const reason = body.reason || "Manual return requested";
    const result = await returnProjectMaterials(id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      returnedMaterials: result.consumedMaterials
    });
  } catch (error) {
    console.error("Error returning project materials:", error);
    return NextResponse.json(
      { error: "Failed to return project materials" },
      { status: 500 }
    );
  }
}
