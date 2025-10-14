import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: warehouseId, materialId } = await params;

    // Get warehouse to check ownership
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { created_by: true, name: true, capacity: true }
    });

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Check if user owns the warehouse or is admin
    if (warehouse.created_by !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current material stock
    const currentMaterial = await prisma.warehouseMaterial.findUnique({
      where: {
        warehouseId_materialId: {
          warehouseId,
          materialId
        }
      },
      include: {
        PricingConfig: true
      }
    });

    if (!currentMaterial) {
      return NextResponse.json({ error: "Material not found in warehouse" }, { status: 404 });
    }

    // Calculate smart replenishment quantity based on material type and warehouse capacity
    const category = currentMaterial.PricingConfig.category;
    const currentStock = Number(currentMaterial.quantity);
    const warehouseCapacity = Number(warehouse.capacity) || 0;

    // Calculate material volume for capacity checking
    let unitVolume = 1;
    const volume = currentMaterial.PricingConfig.volume ? Number(currentMaterial.PricingConfig.volume) : 0;
    const length = currentMaterial.PricingConfig.length ? Number(currentMaterial.PricingConfig.length) : 0;
    const width = currentMaterial.PricingConfig.width ? Number(currentMaterial.PricingConfig.width) : 0;
    const height = currentMaterial.PricingConfig.height ? Number(currentMaterial.PricingConfig.height) : 0;
    
    if (volume > 0) {
      unitVolume = volume;
    } else if (length && width && height) {
      unitVolume = length * width * height;
    }

    // Get available capacity
    const allMaterials = await prisma.warehouseMaterial.findMany({
      where: { warehouseId, isActive: true },
      include: { PricingConfig: true }
    });

    const usedCapacity = allMaterials.reduce((sum, wm) => {
      let materialVolume = 1;
      const vol = wm.PricingConfig.volume ? Number(wm.PricingConfig.volume) : 0;
      const len = wm.PricingConfig.length ? Number(wm.PricingConfig.length) : 0;
      const wid = wm.PricingConfig.width ? Number(wm.PricingConfig.width) : 0;
      const hgt = wm.PricingConfig.height ? Number(wm.PricingConfig.height) : 0;
      
      if (vol > 0) {
        materialVolume = vol;
      } else if (len && wid && hgt) {
        materialVolume = len * wid * hgt;
      }
      return sum + (Number(wm.quantity) * materialVolume);
    }, 0);

    const availableCapacity = warehouseCapacity - usedCapacity;

    // Calculate suggested quantity based on material category
    let suggestedQuantity = 10; // Default

    if (category === 'Labor') {
      suggestedQuantity = 1; // Labor is fixed
    } else if (category === 'Materials') {
      suggestedQuantity = 50; // Roofing materials
    } else if (category === 'Gutter') {
      suggestedQuantity = 25; // Gutters
    } else if (category === 'Insulation' || category === 'Ventilation') {
      suggestedQuantity = 15; // Insulation/Ventilation
    } else if (category === 'Screws' || category === 'Hardware') {
      suggestedQuantity = 150; // Hardware
    }

    // Apply capacity constraints
    const maxQuantityByCapacity = Math.floor(availableCapacity / unitVolume);
    const safeQuantity = Math.floor(maxQuantityByCapacity * 0.5); // Use 50% of available capacity

    const replenishmentQuantity = Math.min(suggestedQuantity, Math.max(1, safeQuantity));

    // Update stock
    const updatedMaterial = await prisma.warehouseMaterial.update({
      where: {
        warehouseId_materialId: {
          warehouseId,
          materialId
        }
      },
      data: {
        quantity: currentStock + replenishmentQuantity,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      quantity: replenishmentQuantity,
      newStock: updatedMaterial.quantity,
      message: `Replenished ${replenishmentQuantity} units of ${currentMaterial.PricingConfig.name}`
    });

  } catch (error) {
    console.error("Error replenishing stock:", error);
    return NextResponse.json({ error: "Failed to replenish stock" }, { status: 500 });
  }
}
