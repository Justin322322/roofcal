import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating material in warehouse
const UpdateMaterialInWarehouseSchema = z.object({
  quantity: z.number().min(0),
  locationAdjustment: z.number().default(0),
  isActive: z.boolean().optional(),
});

// PUT /api/warehouses/[id]/materials/[materialId] - Update warehouse material
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Allow both ADMIN and CLIENT to update materials in warehouses
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId, materialId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateMaterialInWarehouseSchema.parse(body);

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

    // Verify warehouse material exists
    const existingWarehouseMaterial = await prisma.warehousematerial.findFirst({
      where: {
        id: materialId,
        warehouseId,
      },
      include: {
        pricingconfig: true,
      },
    });

    if (!existingWarehouseMaterial) {
      return NextResponse.json(
        { error: "Warehouse material not found" },
        { status: 404 }
      );
    }

    // Update warehouse material
    const warehouseMaterial = await prisma.warehousematerial.update({
      where: { id: materialId },
      data: {
        quantity: validatedData.quantity,
        locationAdjustment: validatedData.locationAdjustment,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : existingWarehouseMaterial.isActive,
        updated_at: new Date(),
      },
      include: {
        pricingconfig: true,
      },
    });

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
        id: warehouseMaterial.pricingconfig.id,
        name: warehouseMaterial.pricingconfig.name,
        label: warehouseMaterial.pricingconfig.label,
        description: warehouseMaterial.pricingconfig.description,
        price: Number(warehouseMaterial.pricingconfig.price),
        unit: warehouseMaterial.pricingconfig.unit,
        category: warehouseMaterial.pricingconfig.category,
        length: warehouseMaterial.pricingconfig.length ? Number(warehouseMaterial.pricingconfig.length) : undefined,
        width: warehouseMaterial.pricingconfig.width ? Number(warehouseMaterial.pricingconfig.width) : undefined,
        height: warehouseMaterial.pricingconfig.height ? Number(warehouseMaterial.pricingconfig.height) : undefined,
        volume: warehouseMaterial.pricingconfig.volume ? Number(warehouseMaterial.pricingconfig.volume) : undefined,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedMaterial,
      message: "Material updated successfully",
    });
  } catch (error) {
    console.error("Error updating warehouse material:", error);

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
      { error: "Failed to update warehouse material" },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouses/[id]/materials/[materialId] - Remove warehouse material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Allow both ADMIN and CLIENT to remove materials from warehouses
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId, materialId } = await params;

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

    // Verify warehouse material exists
    const existingWarehouseMaterial = await prisma.warehousematerial.findFirst({
      where: {
        id: materialId,
        warehouseId,
      },
    });

    if (!existingWarehouseMaterial) {
      return NextResponse.json(
        { error: "Warehouse material not found" },
        { status: 404 }
      );
    }

    // Deactivate the material instead of deleting it to maintain history
    await prisma.warehousematerial.update({
      where: { id: materialId },
      data: {
        isActive: false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Material removed successfully",
    });
  } catch (error) {
    console.error("Error removing warehouse material:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove warehouse material" },
      { status: 500 }
    );
  }
}