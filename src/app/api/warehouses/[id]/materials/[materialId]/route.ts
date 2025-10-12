import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating warehouse material
const UpdateWarehouseMaterialSchema = z.object({
  quantity: z.number().min(0).optional(),
  locationAdjustment: z.number().optional(),
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

    // Only ADMIN can update warehouse materials
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId, materialId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateWarehouseMaterialSchema.parse(body);

    // Verify warehouse material exists
    const existingWarehouseMaterial = await prisma.warehouseMaterial.findUnique({
      where: { id: materialId },
      include: {
        pricingConfig: true,
      },
    });

    if (!existingWarehouseMaterial) {
      return NextResponse.json(
        { error: "Warehouse material not found" },
        { status: 404 }
      );
    }

    // Verify warehouse ID matches
    if (existingWarehouseMaterial.warehouseId !== warehouseId) {
      return NextResponse.json(
        { error: "Warehouse material does not belong to this warehouse" },
        { status: 400 }
      );
    }

    // Update warehouse material
    const updatedWarehouseMaterial = await prisma.warehouseMaterial.update({
      where: { id: materialId },
      data: {
        ...(validatedData.quantity !== undefined && { quantity: validatedData.quantity }),
        ...(validatedData.locationAdjustment !== undefined && { locationAdjustment: validatedData.locationAdjustment }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        updated_at: new Date(),
      },
      include: {
        pricingConfig: true,
      },
    });

    const formattedMaterial = {
      id: updatedWarehouseMaterial.id,
      materialId: updatedWarehouseMaterial.materialId,
      warehouseId: updatedWarehouseMaterial.warehouseId,
      quantity: updatedWarehouseMaterial.quantity,
      locationAdjustment: Number(updatedWarehouseMaterial.locationAdjustment),
      isActive: updatedWarehouseMaterial.isActive,
      createdAt: updatedWarehouseMaterial.created_at,
      updatedAt: updatedWarehouseMaterial.updated_at,
      material: {
        id: updatedWarehouseMaterial.pricingConfig.id,
        name: updatedWarehouseMaterial.pricingConfig.name,
        label: updatedWarehouseMaterial.pricingConfig.label,
        description: updatedWarehouseMaterial.pricingConfig.description,
        price: Number(updatedWarehouseMaterial.pricingConfig.price),
        unit: updatedWarehouseMaterial.pricingConfig.unit,
        category: updatedWarehouseMaterial.pricingConfig.category,
        length: updatedWarehouseMaterial.pricingConfig.length ? Number(updatedWarehouseMaterial.pricingConfig.length) : undefined,
        width: updatedWarehouseMaterial.pricingConfig.width ? Number(updatedWarehouseMaterial.pricingConfig.width) : undefined,
        height: updatedWarehouseMaterial.pricingConfig.height ? Number(updatedWarehouseMaterial.pricingConfig.height) : undefined,
        volume: updatedWarehouseMaterial.pricingConfig.volume ? Number(updatedWarehouseMaterial.pricingConfig.volume) : undefined,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedMaterial,
      message: "Warehouse material updated successfully",
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

// DELETE /api/warehouses/[id]/materials/[materialId] - Remove material from warehouse
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

    // Only ADMIN can remove warehouse materials
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId, materialId } = await params;

    // Verify warehouse material exists
    const existingWarehouseMaterial = await prisma.warehouseMaterial.findUnique({
      where: { id: materialId },
    });

    if (!existingWarehouseMaterial) {
      return NextResponse.json(
        { error: "Warehouse material not found" },
        { status: 404 }
      );
    }

    // Verify warehouse ID matches
    if (existingWarehouseMaterial.warehouseId !== warehouseId) {
      return NextResponse.json(
        { error: "Warehouse material does not belong to this warehouse" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.warehouseMaterial.update({
      where: { id: materialId },
      data: { 
        isActive: false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Material removed from warehouse successfully",
    });
  } catch (error) {
    console.error("Error removing warehouse material:", error);
    return NextResponse.json(
      { error: "Failed to remove warehouse material" },
      { status: 500 }
    );
  }
}
