import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for adding material to warehouse
const AddMaterialToWarehouseSchema = z.object({
  materialId: z.string().uuid(),
  quantity: z.number().min(0),
  locationAdjustment: z.number().default(0),
});


// GET /api/warehouses/[id]/materials - Get materials for a warehouse
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

    // Allow both ADMIN and CLIENT to view warehouse materials
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId } = await params;

    // Verify warehouse exists and user has access
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Get warehouse materials with pricing info
    const warehouseMaterials = await prisma.warehouseMaterial.findMany({
      where: { 
        warehouseId
      },
      include: {
        pricingConfig: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedMaterials = warehouseMaterials.map((wm) => ({
      id: wm.id,
      materialId: wm.materialId,
      warehouseId: wm.warehouseId,
      quantity: wm.quantity,
      locationAdjustment: Number(wm.locationAdjustment),
      isActive: wm.isActive,
      createdAt: wm.created_at,
      updatedAt: wm.updated_at,
      material: {
        id: wm.pricingConfig.id,
        name: wm.pricingConfig.name,
        label: wm.pricingConfig.label,
        description: wm.pricingConfig.description,
        price: Number(wm.pricingConfig.price),
        unit: wm.pricingConfig.unit,
        category: wm.pricingConfig.category,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedMaterials,
    });
  } catch (error) {
    console.error("Error fetching warehouse materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse materials" },
      { status: 500 }
    );
  }
}

// POST /api/warehouses/[id]/materials - Add material to warehouse
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

    // Only ADMIN can add materials to warehouses
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = AddMaterialToWarehouseSchema.parse(body);

    // Verify warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Verify material exists in pricing config
    const material = await prisma.pricingConfig.findUnique({
      where: { id: validatedData.materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if material already exists in warehouse (active only)
    const existingActiveMaterial = await prisma.warehouseMaterial.findFirst({
      where: {
        warehouseId,
        materialId: validatedData.materialId,
        isActive: true,
      },
    });

    if (existingActiveMaterial) {
      return NextResponse.json(
        { error: "Material already exists in this warehouse" },
        { status: 400 }
      );
    }

    // Check if there's an inactive material to reactivate
    const existingInactiveMaterial = await prisma.warehouseMaterial.findUnique({
      where: {
        warehouseId_materialId: {
          warehouseId,
          materialId: validatedData.materialId,
        },
      },
      include: {
        pricingConfig: true,
      },
    });

    let warehouseMaterial;

    if (existingInactiveMaterial && !existingInactiveMaterial.isActive) {
      // Reactivate existing inactive material
      warehouseMaterial = await prisma.warehouseMaterial.update({
        where: { id: existingInactiveMaterial.id },
        data: {
          quantity: validatedData.quantity,
          locationAdjustment: validatedData.locationAdjustment,
          isActive: true,
          updated_at: new Date(),
        },
        include: {
          pricingConfig: true,
        },
      });
    } else {
      // Create new warehouse material
      warehouseMaterial = await prisma.warehouseMaterial.create({
        data: {
          warehouseId,
          materialId: validatedData.materialId,
          quantity: validatedData.quantity,
          locationAdjustment: validatedData.locationAdjustment,
          isActive: true,
        },
        include: {
          pricingConfig: true,
        },
      });
    }

    const formattedMaterial = {
      id: warehouseMaterial.id,
      materialId: warehouseMaterial.materialId,
      warehouseId: warehouseMaterial.warehouseId,
      quantity: warehouseMaterial.quantity,
      locationAdjustment: Number(warehouseMaterial.locationAdjustment),
      isActive: warehouseMaterial.isActive,
      createdAt: warehouseMaterial.created_at,
      updatedAt: warehouseMaterial.updated_at,
      material: {
        id: warehouseMaterial.pricingConfig.id,
        name: warehouseMaterial.pricingConfig.name,
        label: warehouseMaterial.pricingConfig.label,
        description: warehouseMaterial.pricingConfig.description,
        price: Number(warehouseMaterial.pricingConfig.price),
        unit: warehouseMaterial.pricingConfig.unit,
        category: warehouseMaterial.pricingConfig.category,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedMaterial,
      message: "Material added to warehouse successfully",
    });
  } catch (error) {
    console.error("Error adding material to warehouse:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add material to warehouse" },
      { status: 500 }
    );
  }
}
