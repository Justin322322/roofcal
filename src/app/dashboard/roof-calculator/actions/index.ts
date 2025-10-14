"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
// Removed unused import: notifyProjectAssigned is no longer used in project creation
import type {
  CreateProjectInput,
  Project,
  ProjectFromCalculator,
  ProjectToCalculator,
} from "@/types/project";
import type { Prisma } from "@prisma/client";
import { UserRole } from "@/types/user-role";

/**
 * Save current calculator data as a new project
 */
export async function saveProject(
  data: ProjectFromCalculator
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Validate required fields
    if (!data.warehouseId) {
      return { success: false, error: "Warehouse selection is required" };
    }

    // Convert calculator data to project format
    const projectData: CreateProjectInput = {
      projectName: data.projectName,
      clientName: data.clientName,
      status: "DRAFT",

      // Delivery and Location
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      latitude: data.latitude,
      longitude: data.longitude,
      deliveryCost: data.deliveryCost,
      deliveryDistance: data.deliveryDistance,
      warehouseId: data.warehouseId,

      // Measurements
      length: parseFloat(data.measurements.length) || 0,
      width: parseFloat(data.measurements.width) || 0,
      pitch: parseFloat(data.measurements.pitch) || 0,
      roofType: data.measurements.roofType,
      floors: parseInt(data.measurements.floors) || 1,
      materialThickness: data.measurements.materialThickness,
      ridgeType: data.measurements.ridgeType,
      gutterSize: data.measurements.gutterSize,
      budgetLevel: data.measurements.budgetLevel,
      budgetAmount: parseFloat(data.measurements.budgetAmount) || undefined,
      constructionMode: data.measurements.constructionMode.toUpperCase() as
        | "NEW"
        | "REPAIR",
      gutterLengthA: parseFloat(data.measurements.gutterLengthA) || undefined,
      gutterSlope: parseFloat(data.measurements.gutterSlope) || undefined,
      gutterLengthC: parseFloat(data.measurements.gutterLengthC) || undefined,
      insulationThickness: data.measurements.insulationThickness,
      ventilationPieces: parseInt(data.measurements.ventilationPieces) || 0,

      // Material
      material: data.material,

      // Results
      area: data.results.area,
      materialCost: data.results.materialCost,
      gutterCost: data.results.gutterCost,
      ridgeCost: data.results.ridgeCost,
      screwsCost: data.results.screwsCost,
      insulationCost: data.results.insulationCost,
      ventilationCost: data.results.ventilationCost,
      totalMaterialsCost: data.results.totalMaterialsCost,
      laborCost: data.results.laborCost,
      removalCost: data.results.removalCost,
      totalCost: data.results.totalCost,
      gutterPieces: data.results.gutterPieces,
      ridgeLength: data.results.ridgeLength,

      // Decision Tree
      complexityScore: data.decisionTree.complexity.score,
      complexityLevel: data.decisionTree.complexity.level,
      recommendedMaterial:
        data.decisionTree.materialRecommendation.recommendedMaterial,
      optimizationTips: JSON.stringify(data.decisionTree.optimizationTips),

      // Metadata
      notes: data.notes,
    };

    // For client-created projects, don't auto-assign to contractor immediately
    // Projects should remain in DRAFT status until client explicitly requests contractor assignment
    const contractorId = null;

    const project = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        clientId: session.user.role === UserRole.CLIENT ? session.user.id : null,
        contractorId: contractorId,
        status: "DRAFT", // Always start as DRAFT, regardless of user role
        proposalStatus: "DRAFT",
        assignedAt: null, // No assignment initially
        updated_at: new Date(),
        ...projectData,
      },
    });

    // No notification sent here - projects remain in DRAFT until explicitly assigned

    revalidatePath("/dashboard?tab=roof-calculator");

    return { success: true, projectId: project.id };
  } catch (error) {
    console.error("Error saving project:", error);
    return { success: false, error: "Failed to save project" };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  data: Partial<ProjectFromCalculator>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    // Build update data using Prisma's unchecked input to allow scalar FK updates
    const updateData: Prisma.projectUncheckedUpdateInput = {};

    if (data.projectName) updateData.projectName = data.projectName;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update delivery fields if provided
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId;
    if (data.deliveryCost !== undefined) updateData.deliveryCost = data.deliveryCost;
    if (data.deliveryDistance !== undefined) updateData.deliveryDistance = data.deliveryDistance;

    // Update measurements if provided
    if (data.measurements) {
      if (data.measurements.length)
        updateData.length = parseFloat(data.measurements.length);
      if (data.measurements.width)
        updateData.width = parseFloat(data.measurements.width);
      if (data.measurements.pitch)
        updateData.pitch = parseFloat(data.measurements.pitch);
      if (data.measurements.roofType)
        updateData.roofType = data.measurements.roofType;
      if (data.measurements.floors)
        updateData.floors = parseInt(data.measurements.floors);
      if (data.measurements.materialThickness)
        updateData.materialThickness = data.measurements.materialThickness;
      if (data.measurements.ridgeType)
        updateData.ridgeType = data.measurements.ridgeType;
      if (data.measurements.gutterSize)
        updateData.gutterSize = data.measurements.gutterSize;
      if (data.measurements.budgetLevel)
        updateData.budgetLevel = data.measurements.budgetLevel;
      if (data.measurements.budgetAmount)
        updateData.budgetAmount = parseFloat(data.measurements.budgetAmount);
      if (data.measurements.constructionMode)
        updateData.constructionMode =
          data.measurements.constructionMode.toUpperCase() as "NEW" | "REPAIR";
      if (data.measurements.gutterLengthA)
        updateData.gutterLengthA = parseFloat(data.measurements.gutterLengthA);
      if (data.measurements.gutterSlope)
        updateData.gutterSlope = parseFloat(data.measurements.gutterSlope);
      if (data.measurements.gutterLengthC)
        updateData.gutterLengthC = parseFloat(data.measurements.gutterLengthC);
      if (data.measurements.insulationThickness)
        updateData.insulationThickness = data.measurements.insulationThickness;
      if (data.measurements.ventilationPieces)
        updateData.ventilationPieces = parseInt(
          data.measurements.ventilationPieces
        );
    }

    if (data.material) updateData.material = data.material;

    // Update results if provided
    if (data.results) {
      updateData.area = data.results.area;
      updateData.materialCost = data.results.materialCost;
      updateData.gutterCost = data.results.gutterCost;
      updateData.ridgeCost = data.results.ridgeCost;
      updateData.screwsCost = data.results.screwsCost;
      updateData.insulationCost = data.results.insulationCost;
      updateData.ventilationCost = data.results.ventilationCost;
      updateData.totalMaterialsCost = data.results.totalMaterialsCost;
      updateData.laborCost = data.results.laborCost;
      updateData.removalCost = data.results.removalCost;
      updateData.totalCost = data.results.totalCost;
      updateData.gutterPieces = data.results.gutterPieces;
      updateData.ridgeLength = data.results.ridgeLength;
    }

    // Update decision tree if provided
    if (data.decisionTree) {
      updateData.complexityScore = data.decisionTree.complexity.score;
      updateData.complexityLevel = data.decisionTree.complexity.level;
      updateData.recommendedMaterial =
        data.decisionTree.materialRecommendation.recommendedMaterial;
      updateData.optimizationTips = JSON.stringify(
        data.decisionTree.optimizationTips
      );
    }

    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    revalidatePath("/dashboard?tab=roof-calculator");
    revalidatePath(`/dashboard/roof-calculator`);

    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

/**
 * Load project data into calculator
 */
export async function loadProject(
  projectId: string
): Promise<{ success: boolean; data?: ProjectToCalculator; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Convert project data to calculator format
    const calculatorData: ProjectToCalculator = {
      measurements: {
        length: project.length.toString(),
        width: project.width.toString(),
        pitch: project.pitch.toString(),
        roofType: project.roofType,
        floors: project.floors.toString(),
        materialThickness: project.materialThickness,
        ridgeType: project.ridgeType,
        gutterSize: project.gutterSize,
        budgetLevel: project.budgetLevel,
        budgetAmount: project.budgetAmount?.toString() || "",
        constructionMode: project.constructionMode.toLowerCase() as
          | "new"
          | "repair",
        gutterLengthA: project.gutterLengthA?.toString() || "",
        gutterSlope: project.gutterSlope?.toString() || "",
        gutterLengthC: project.gutterLengthC?.toString() || "",
        insulationThickness: project.insulationThickness,
        ventilationPieces: project.ventilationPieces.toString(),
        screwType: "",
      },
      material: project.material,
      projectId: project.id,
    };

    return { success: true, data: calculatorData };
  } catch (error) {
    console.error("Error loading project:", error);
    return { success: false, error: "Failed to load project" };
  }
}

/**
 * Duplicate an existing project
 */
export async function duplicateProject(
  projectId: string
): Promise<{ success: boolean; newProjectId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const originalProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!originalProject) {
      return { success: false, error: "Project not found" };
    }

    // Create duplicate with modified name
    const duplicateProject = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        projectName: `${originalProject.projectName} (Copy)`,
        clientName: originalProject.clientName,
        status: "DRAFT",
        updated_at: new Date(),

        // Copy all measurements
        length: originalProject.length,
        width: originalProject.width,
        pitch: originalProject.pitch,
        roofType: originalProject.roofType,
        floors: originalProject.floors,
        materialThickness: originalProject.materialThickness,
        ridgeType: originalProject.ridgeType,
        gutterSize: originalProject.gutterSize,
        budgetLevel: originalProject.budgetLevel,
        budgetAmount: originalProject.budgetAmount,
        constructionMode: originalProject.constructionMode,
        gutterLengthA: originalProject.gutterLengthA,
        gutterSlope: originalProject.gutterSlope,
        gutterLengthC: originalProject.gutterLengthC,
        insulationThickness: originalProject.insulationThickness,
        ventilationPieces: originalProject.ventilationPieces,

        // Copy material
        material: originalProject.material,

        // Copy results
        area: originalProject.area,
        materialCost: originalProject.materialCost,
        gutterCost: originalProject.gutterCost,
        ridgeCost: originalProject.ridgeCost,
        screwsCost: originalProject.screwsCost,
        insulationCost: originalProject.insulationCost,
        ventilationCost: originalProject.ventilationCost,
        totalMaterialsCost: originalProject.totalMaterialsCost,
        laborCost: originalProject.laborCost,
        removalCost: originalProject.removalCost,
        totalCost: originalProject.totalCost,
        gutterPieces: originalProject.gutterPieces,
        ridgeLength: originalProject.ridgeLength,

        // Copy decision tree
        complexityScore: originalProject.complexityScore,
        complexityLevel: originalProject.complexityLevel,
        recommendedMaterial: originalProject.recommendedMaterial,
        optimizationTips: originalProject.optimizationTips,

        // Copy metadata
        notes: originalProject.notes,
      },
    });

    revalidatePath("/dashboard?tab=roof-calculator");

    return { success: true, newProjectId: duplicateProject.id };
  } catch (error) {
    console.error("Error duplicating project:", error);
    return { success: false, error: "Failed to duplicate project" };
  }
}

/**
 * Export project data as JSON
 */
export async function exportProject(
  projectId: string
): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Convert Decimal to number for JSON response
    const projectData: Project = {
      ...project,
      // Exclude stageProgress as it has JsonValue type from Prisma but needs Record<ProjectStage, boolean>
      stageProgress: undefined,
      clientName: project.clientName || undefined,
      recommendedMaterial: project.recommendedMaterial || undefined,
      optimizationTips: project.optimizationTips || undefined,
      notes: project.notes || undefined,
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
      // Convert location Decimal fields to number
      latitude: project.latitude ? Number(project.latitude) : null,
      longitude: project.longitude ? Number(project.longitude) : null,
      deliveryCost: project.deliveryCost ? Number(project.deliveryCost) : null,
      deliveryDistance: project.deliveryDistance ? Number(project.deliveryDistance) : null,
    };

    return { success: true, data: projectData };
  } catch (error) {
    console.error("Error exporting project:", error);
    return { success: false, error: "Failed to export project" };
  }
}

/**
 * Get project details for editing
 */
export async function getProjectDetails(
  projectId: string
): Promise<{
  success: boolean;
  project?: { 
    projectName: string; 
    clientName?: string; 
    notes?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    warehouseId?: string;
  };
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      select: {
        projectName: true,
        clientName: true,
        notes: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        warehouseId: true,
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return {
      success: true,
      project: {
        projectName: project.projectName,
        clientName: project.clientName || undefined,
        notes: project.notes || undefined,
        address: project.address || undefined,
        city: project.city || undefined,
        state: project.state || undefined,
        zipCode: project.zipCode || undefined,
        latitude: project.latitude ? Number(project.latitude) : undefined,
        longitude: project.longitude ? Number(project.longitude) : undefined,
        warehouseId: project.warehouseId || undefined,
      },
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return { success: false, error: "Failed to fetch project details" };
  }
}

/**
 * Get user's projects for dropdown
 */
export async function getUserProjects(): Promise<{
  success: boolean;
  projects?: Array<{ id: string; projectName: string; status: string }>;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        status: { not: "ARCHIVED" },
      },
      select: {
        id: true,
        projectName: true,
        status: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    return { success: true, projects };
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}
