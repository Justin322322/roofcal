import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyLowStock } from "@/lib/notifications";

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
    const existingWarehouseMaterial = await prisma.warehousematerial.findUnique({
      where: { id: materialId },
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

    // Verify warehouse ID matches
    if (existingWarehouseMaterial.warehouseId !== warehouseId) {
      return NextResponse.json(
        { error: "Warehouse material does not belong to this warehouse" },
        { status: 400 }
      );
    }

    // Update warehouse material
    const updatedWarehouseMaterial = await prisma.warehousematerial.update({
      where: { id: materialId },
      data: {
        ...(validatedData.quantity !== undefined && { quantity: validatedData.quantity }),
        ...(validatedData.locationAdjustment !== undefined && { locationAdjustment: validatedData.locationAdjustment }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        updated_at: new Date(),
      },
      include: {
        pricingconfig: true,
      },
    });

    // If quantity was updated, evaluate thresholds and notify if low
    if (validatedData.quantity !== undefined) {
      const newQty = updatedWarehouseMaterial.quantity;
      // Simple threshold heuristic based on category like in warnings component
      let warningThreshold = 10;
      let criticalThreshold = 5;
      const category = updatedWarehouseMaterial.pricingconfig.category;
      if (category === 'Labor') {
        warningThreshold = 1;
        criticalThreshold = 0;
      } else if (category === 'Insulation' || category === 'Ventilation') {
        warningThreshold = 5;
        criticalThreshold = 2;
      } else if (category === 'Gutter') {
        warningThreshold = 15;
        criticalThreshold = 8;
      }

      if (newQty <= warningThreshold) {
        try {
          // Determine recipients: notify the updating admin and optionally an admin inbox
          const toUserId = session.user.id;
          const toUserName = session.user.name || 'Admin';
          const toUserEmail = session.user.email || '';

          await notifyLowStock({
            fromUserId: session.user.id,
            fromUserName: session.user.name || 'System',
            toUserId,
            toUserName,
            toUserEmail,
            warehouseName: (await prisma.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } }))?.name || 'Warehouse',
            materialName: updatedWarehouseMaterial.pricingconfig.label || updatedWarehouseMaterial.pricingconfig.name,
            currentStock: newQty,
            threshold: criticalThreshold,
          });
        } catch (e) {
          console.error('Failed to send low stock notification', e);
        }
      }
    }

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
        id: updatedWarehouseMaterial.pricingconfig.id,
        name: updatedWarehouseMaterial.pricingconfig.name,
        label: updatedWarehouseMaterial.pricingconfig.label,
        description: updatedWarehouseMaterial.pricingconfig.description,
        price: Number(updatedWarehouseMaterial.pricingconfig.price),
        unit: updatedWarehouseMaterial.pricingconfig.unit,
        category: updatedWarehouseMaterial.pricingconfig.category,
        length: updatedWarehouseMaterial.pricingconfig.length ? Number(updatedWarehouseMaterial.pricingconfig.length) : undefined,
        width: updatedWarehouseMaterial.pricingconfig.width ? Number(updatedWarehouseMaterial.pricingconfig.width) : undefined,
        height: updatedWarehouseMaterial.pricingconfig.height ? Number(updatedWarehouseMaterial.pricingconfig.height) : undefined,
        volume: updatedWarehouseMaterial.pricingconfig.volume ? Number(updatedWarehouseMaterial.pricingconfig.volume) : undefined,
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
    const existingWarehouseMaterial = await prisma.warehousematerial.findUnique({
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
    await prisma.warehousematerial.update({
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
