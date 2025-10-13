import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { findBestWarehouseForProject } from "@/lib/material-calculator";
import type {
  CreateProjectInput,
  ProjectFilters,
  ProjectListResponse,
} from "@/types/project";

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: CreateProjectInput = await request.json();

    // Validate required fields
    if (!body.projectName || !body.length || !body.width || !body.material) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: projectName, length, width, material",
        },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        projectName: body.projectName,
        clientName: body.clientName,
        status: body.status || "DRAFT",

        // Contractor-Client relationship fields
        contractorId: body.contractorId,
        clientId: body.clientId,
        assignedAt: body.assignedAt,
        proposalSent: body.proposalSent,
        proposalStatus: body.proposalStatus || "DRAFT",

        // Delivery and Location
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        latitude: body.latitude,
        longitude: body.longitude,
        deliveryCost: body.deliveryCost,
        deliveryDistance: body.deliveryDistance,
        warehouseId: body.warehouseId,

        // Measurements
        length: body.length,
        width: body.width,
        pitch: body.pitch,
        roofType: body.roofType,
        floors: body.floors,
        materialThickness: body.materialThickness,
        ridgeType: body.ridgeType,
        gutterSize: body.gutterSize,
        budgetLevel: body.budgetLevel,
        budgetAmount: body.budgetAmount,
        constructionMode: body.constructionMode || "NEW",
        gutterLengthA: body.gutterLengthA,
        gutterSlope: body.gutterSlope,
        gutterLengthC: body.gutterLengthC,
        insulationThickness: body.insulationThickness,
        ventilationPieces: body.ventilationPieces,

        // Material
        material: body.material,

        // Results
        area: body.area,
        materialCost: body.materialCost,
        gutterCost: body.gutterCost,
        ridgeCost: body.ridgeCost,
        screwsCost: body.screwsCost,
        insulationCost: body.insulationCost,
        ventilationCost: body.ventilationCost,
        totalMaterialsCost: body.totalMaterialsCost,
        laborCost: body.laborCost,
        removalCost: body.removalCost,
        totalCost: body.totalCost,
        gutterPieces: body.gutterPieces,
        ridgeLength: body.ridgeLength,

        // Decision Tree
        complexityScore: body.complexityScore,
        complexityLevel: body.complexityLevel,
        recommendedMaterial: body.recommendedMaterial,
        optimizationTips: body.optimizationTips,

        // Metadata
        notes: body.notes,
      },
    });

    // Calculate and assign best warehouse if not already assigned
    if (!project.warehouseId && project.status !== "DRAFT") {
      try {
        const bestWarehouseId = await findBestWarehouseForProject(project);
        if (bestWarehouseId) {
          await prisma.project.update({
            where: { id: project.id },
            data: { warehouseId: bestWarehouseId }
          });
          project.warehouseId = bestWarehouseId;
        }
      } catch (error) {
        console.error("Error assigning warehouse to project:", error);
        // Don't fail project creation if warehouse assignment fails
      }
    }

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: ProjectFilters = {
      status:
        (searchParams.get("status") as ProjectFilters["status"]) || undefined,
      search: searchParams.get("search") || undefined,
      sortBy:
        (searchParams.get("sortBy") as ProjectFilters["sortBy"]) ||
        "created_at",
      sortOrder:
        (searchParams.get("sortOrder") as ProjectFilters["sortOrder"]) ||
        "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    // Build where clause
    const where: {
      userId: string;
      status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
      OR?: Array<{
        projectName?: { contains: string; mode: "insensitive" };
        clientName?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      userId: session.user.id,
    };

    if (filters.status) {
      where.status = filters.status as
        | "DRAFT"
        | "ACTIVE"
        | "COMPLETED"
        | "ARCHIVED";
    }

    if (filters.search) {
      where.OR = [
        { projectName: { contains: filters.search, mode: "insensitive" } },
        { clientName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (filters.page! - 1) * filters.limit!;
    const take = filters.limit!;

    // Build orderBy - ensure field names match Prisma schema
    const orderBy: Record<string, "asc" | "desc"> = {};
    
    // Map frontend sortBy to actual database field names
    const sortFieldMap: Record<string, string> = {
      "created_at": "created_at",
      "updated_at": "updated_at", 
      "projectName": "projectName",
      "totalCost": "totalCost",
      "area": "area"
    };
    
    const dbFieldName = sortFieldMap[filters.sortBy!] || "created_at";
    orderBy[dbFieldName] = filters.sortOrder!;

    // Get projects and total count
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          contractor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true
            }
          }
        }
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / filters.limit!);

    const response: ProjectListResponse = {
      projects: projects.map((project) => ({
        ...project,
        // Exclude stageProgress as it has JsonValue type from Prisma but needs Record<ProjectStage, boolean>
        stageProgress: undefined,
        clientName: project.clientName || undefined,
        recommendedMaterial: project.recommendedMaterial || undefined,
        optimizationTips: project.optimizationTips || undefined,
        notes: project.notes || undefined,
        // Convert Decimal to number for JSON response
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
      })),
      total,
      page: filters.page!,
      limit: filters.limit!,
      totalPages,
    };

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // Log more detailed error information for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check for Prisma-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string; meta?: unknown };
      console.error("Prisma error code:", prismaError.code);
      console.error("Prisma error meta:", prismaError.meta);
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
