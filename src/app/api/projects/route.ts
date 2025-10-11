import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
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
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: CreateProjectInput = await request.json();

    // Validate required fields
    if (!body.projectName || !body.length || !body.width || !body.material) {
      return NextResponse.json(
        {
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
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
        { error: "Authentication required" },
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

    // Build orderBy
    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[filters.sortBy!] = filters.sortOrder!;

    // Get projects and total count
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / filters.limit!);

    const response: ProjectListResponse = {
      projects: projects.map((project) => ({
        ...project,
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
      })),
      total,
      page: filters.page!,
      limit: filters.limit!,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
