import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { reserveProjectMaterials, consumeProjectMaterials, returnProjectMaterials } from "@/lib/material-consumption";
import type { UpdateProjectInput } from "@/types/project";
import { Prisma } from "@prisma/client";

// GET /api/projects/[id] - Get single project
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

    // Convert Decimal to number for JSON response
    const response = {
      ...project,
      length: Number(project.length),
      width: Number(project.width),
      pitch: Number(project.pitch),
      budgetAmount: project.budgetAmount
        ? Number(project.budgetAmount)
        : undefined,
      gutterLengthA: project.gutterLengthA
        ? Number(project.gutterLengthA)
        : undefined,
      gutterSlope: project.gutterSlope
        ? Number(project.gutterSlope)
        : undefined,
      gutterLengthC: project.gutterLengthC
        ? Number(project.gutterLengthC)
        : undefined,
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
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
    const body: UpdateProjectInput = await request.json();

    // Check if project exists and user has access to it
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // Project owner
          { contractorId: session.user.id }, // Assigned contractor
        ],
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Handle material consumption based on status changes
    if (body.status && body.status !== existingProject.status) {
      const oldStatus = existingProject.status;
      const newStatus = body.status;

      // When project is accepted, reserve materials
      if (newStatus === "ACCEPTED" && !existingProject.materialsConsumed) {
        const reserveResult = await reserveProjectMaterials(id);
        if (!reserveResult.success) {
          return NextResponse.json(
            { error: reserveResult.message },
            { status: 400 }
          );
        }
      }

      // When project starts work, consume reserved materials
      if (newStatus === "IN_PROGRESS" && oldStatus === "ACCEPTED") {
        const consumeResult = await consumeProjectMaterials(id);
        if (!consumeResult.success) {
          return NextResponse.json(
            { error: consumeResult.message },
            { status: 400 }
          );
        }
      }

      // When project is rejected, cancelled, or archived, return materials
      if ((newStatus === "REJECTED" || newStatus === "ARCHIVED") && 
          (oldStatus === "ACCEPTED" || oldStatus === "IN_PROGRESS")) {
        const returnResult = await returnProjectMaterials(id, `Status changed from ${oldStatus} to ${newStatus}`);
        if (!returnResult.success) {
          console.error("Failed to return materials:", returnResult.message);
          // Don't fail the status update, just log the error
        }
      }

      // When project is completed, automatically update proposalStatus to COMPLETED if it was ACCEPTED
      if (newStatus === "COMPLETED" && existingProject.proposalStatus === "ACCEPTED") {
        body.proposalStatus = "COMPLETED";
      }
    }

    // Update project, including stage fields for single-page workflow
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.projectName && { projectName: body.projectName }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.status && { status: body.status }),
        ...(body.currentStage && { currentStage: body.currentStage }),
        ...(body.stageProgress && { stageProgress: body.stageProgress as Prisma.InputJsonValue }),

        // Measurements
        ...(body.length && { length: body.length }),
        ...(body.width && { width: body.width }),
        ...(body.pitch && { pitch: body.pitch }),
        ...(body.roofType && { roofType: body.roofType }),
        ...(body.floors && { floors: body.floors }),
        ...(body.materialThickness && {
          materialThickness: body.materialThickness,
        }),
        ...(body.ridgeType && { ridgeType: body.ridgeType }),
        ...(body.gutterSize && { gutterSize: body.gutterSize }),
        ...(body.budgetLevel && { budgetLevel: body.budgetLevel }),
        ...(body.budgetAmount !== undefined && {
          budgetAmount: body.budgetAmount,
        }),
        ...(body.constructionMode && {
          constructionMode: body.constructionMode,
        }),
        ...(body.gutterLengthA !== undefined && {
          gutterLengthA: body.gutterLengthA,
        }),
        ...(body.gutterSlope !== undefined && {
          gutterSlope: body.gutterSlope,
        }),
        ...(body.gutterLengthC !== undefined && {
          gutterLengthC: body.gutterLengthC,
        }),
        ...(body.insulationThickness && {
          insulationThickness: body.insulationThickness,
        }),
        ...(body.ventilationPieces && {
          ventilationPieces: body.ventilationPieces,
        }),

        // Material
        ...(body.material && { material: body.material }),

        // Results
        ...(body.area && { area: body.area }),
        ...(body.materialCost && { materialCost: body.materialCost }),
        ...(body.gutterCost && { gutterCost: body.gutterCost }),
        ...(body.ridgeCost && { ridgeCost: body.ridgeCost }),
        ...(body.screwsCost && { screwsCost: body.screwsCost }),
        ...(body.insulationCost && { insulationCost: body.insulationCost }),
        ...(body.ventilationCost && { ventilationCost: body.ventilationCost }),
        ...(body.totalMaterialsCost && {
          totalMaterialsCost: body.totalMaterialsCost,
        }),
        ...(body.laborCost && { laborCost: body.laborCost }),
        ...(body.removalCost && { removalCost: body.removalCost }),
        ...(body.totalCost && { totalCost: body.totalCost }),
        ...(body.gutterPieces && { gutterPieces: body.gutterPieces }),
        ...(body.ridgeLength && { ridgeLength: body.ridgeLength }),

        // Decision Tree
        ...(body.complexityScore && { complexityScore: body.complexityScore }),
        ...(body.complexityLevel && { complexityLevel: body.complexityLevel }),
        ...(body.recommendedMaterial !== undefined && {
          recommendedMaterial: body.recommendedMaterial,
        }),
        ...(body.optimizationTips !== undefined && {
          optimizationTips: body.optimizationTips,
        }),

        // Contractor-Client relationship fields
        ...(body.contractorId !== undefined && { contractorId: body.contractorId }),
        ...(body.clientId !== undefined && { clientId: body.clientId }),
        ...(body.assignedAt !== undefined && { assignedAt: body.assignedAt }),
        ...(body.proposalSent !== undefined && { proposalSent: body.proposalSent }),
        ...(body.proposalStatus !== undefined && { proposalStatus: body.proposalStatus }),

        // Metadata
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    // Convert Decimal to number for JSON response
    const response = {
      ...project,
      length: Number(project.length),
      width: Number(project.width),
      pitch: Number(project.pitch),
      budgetAmount: project.budgetAmount
        ? Number(project.budgetAmount)
        : undefined,
      gutterLengthA: project.gutterLengthA
        ? Number(project.gutterLengthA)
        : undefined,
      gutterSlope: project.gutterSlope
        ? Number(project.gutterSlope)
        : undefined,
      gutterLengthC: project.gutterLengthC
        ? Number(project.gutterLengthC)
        : undefined,
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Soft delete project
export async function DELETE(
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

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Soft delete by setting status to ARCHIVED
    await prisma.project.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ message: "Project archived successfully" });
  } catch (error) {
    console.error("Error archiving project:", error);
    return NextResponse.json(
      { error: "Failed to archive project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project status or unarchive
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

    // Check if project exists and user has access to it
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // Project owner
          { contractorId: session.user.id }, // Assigned contractor
          { clientId: session.user.id }, // Assigned client
        ],
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Handle status updates
    if (body.status) {
      const oldStatus = existingProject.status;
      const newStatus = body.status;

      // Handle material consumption based on status changes
      if (newStatus !== oldStatus) {
        // When project is accepted, reserve materials
        if (newStatus === "ACCEPTED" && !existingProject.materialsConsumed) {
          const reserveResult = await reserveProjectMaterials(id);
          if (!reserveResult.success) {
            return NextResponse.json(
              { error: reserveResult.message },
              { status: 400 }
            );
          }
        }

        // When project starts work, consume reserved materials
        if (newStatus === "IN_PROGRESS" && oldStatus === "ACCEPTED") {
          const consumeResult = await consumeProjectMaterials(id);
          if (!consumeResult.success) {
            return NextResponse.json(
              { error: consumeResult.message },
              { status: 400 }
            );
          }
        }

        // When project is rejected, cancelled, or archived, return materials
        if ((newStatus === "REJECTED" || newStatus === "ARCHIVED") && 
            (oldStatus === "ACCEPTED" || oldStatus === "IN_PROGRESS")) {
          const returnResult = await returnProjectMaterials(id, `Status changed from ${oldStatus} to ${newStatus}`);
          if (!returnResult.success) {
            console.error("Failed to return materials:", returnResult.message);
            // Don't fail the status update, just log the error
          }
        }

        // When project is completed, automatically update proposalStatus to COMPLETED if it was ACCEPTED
        if (newStatus === "COMPLETED" && existingProject.proposalStatus === "ACCEPTED") {
          body.proposalStatus = "COMPLETED";
        }
      }

      // Update project status
      const project = await prisma.project.update({
        where: { id },
        data: {
          status: newStatus,
          ...(body.proposalStatus && { proposalStatus: body.proposalStatus }),
        },
      });

      return NextResponse.json({ 
        message: "Project status updated successfully",
        project: {
          ...project,
          length: Number(project.length),
          width: Number(project.width),
          pitch: Number(project.pitch),
          area: Number(project.area),
          materialCost: Number(project.materialCost),
          laborCost: Number(project.laborCost),
          removalCost: Number(project.removalCost),
          totalCost: Number(project.totalCost),
          ridgeLength: Number(project.ridgeLength),
        }
      });
    }

    // Handle unarchive (legacy functionality)
    if (body.unarchive) {
      if (existingProject.status !== "ARCHIVED") {
        return NextResponse.json(
          { error: "Project is not archived" },
          { status: 400 }
        );
      }

      await prisma.project.update({
        where: { id },
        data: { status: "ACTIVE" },
      });

      return NextResponse.json({ message: "Project unarchived successfully" });
    }

    return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
