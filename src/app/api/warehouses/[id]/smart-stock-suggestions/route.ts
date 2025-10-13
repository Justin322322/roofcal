import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";
import { calculateSmartStockSuggestions } from "@/lib/smart-stock-planner";

// GET /api/warehouses/[id]/smart-stock-suggestions - Get smart stock suggestions for a warehouse
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

    // Allow both ADMIN and CLIENT to view smart stock suggestions
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId } = await params;

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

    // Get current warehouse materials with low stock warnings
    const warehouseMaterials = await prisma.warehousematerial.findMany({
      where: { 
        warehouseId,
        isActive: true
      },
      include: {
        pricingconfig: true,
        projectmaterial: {
          where: {
            status: 'RESERVED'
          },
          include: {
            project: {
              select: {
                id: true,
                projectName: true
              }
            }
          }
        }
      }
    });

    // Transform to warnings format
    const warnings = warehouseMaterials.map(wm => {
      const currentStock = wm.quantity;
      const reservedForProjects = wm.projectmaterial.reduce((sum, pm) => sum + pm.quantity, 0);
      const projectedStock = currentStock - reservedForProjects;
      
      // Determine if this is a warning (low stock)
      let criticalLevel = false;
      let warningLevel = false;
      
      if (wm.pricingconfig.category === 'Labor') {
        criticalLevel = currentStock <= 0;
        warningLevel = currentStock <= 1;
      } else if (wm.pricingconfig.category === 'Insulation' || wm.pricingconfig.category === 'Ventilation') {
        criticalLevel = currentStock <= 2;
        warningLevel = currentStock <= 5;
      } else if (wm.pricingconfig.category === 'Gutter') {
        criticalLevel = currentStock <= 8;
        warningLevel = currentStock <= 15;
      } else {
        criticalLevel = currentStock <= 5;
        warningLevel = currentStock <= 10;
      }

      return {
        materialId: wm.materialId,
        materialName: wm.pricingconfig.label,
        currentStock,
        reservedForProjects,
        projectedStock,
        criticalLevel: criticalLevel || warningLevel,
        projectsUsing: wm.projectmaterial.map(pm => ({
          projectId: pm.project.id,
          projectName: pm.project.projectName,
          quantity: pm.quantity
        }))
      };
    }).filter(w => w.criticalLevel); // Only include items with warnings

    // Calculate smart stock suggestions
    const suggestions = await calculateSmartStockSuggestions(warehouseId, warnings);

    return NextResponse.json({
      success: true,
      data: {
        warehouseId,
        warehouseName: warehouse.name,
        suggestions,
        totalSuggestions: suggestions.length,
        totalStockToAdd: suggestions.reduce((sum, s) => sum + s.stockToAdd, 0)
      }
    });
  } catch (error) {
    console.error("Error fetching smart stock suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch smart stock suggestions" },
      { status: 500 }
    );
  }
}

// POST /api/warehouses/[id]/smart-stock-suggestions - Apply smart stock suggestions
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

    // Allow both ADMIN and CLIENT to apply smart stock suggestions
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id: warehouseId } = await params;
    const body = await request.json();
    const { suggestions } = body;

    if (!suggestions || !Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: "Invalid suggestions format" },
        { status: 400 }
      );
    }

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

    // Apply suggestions
    const results = [];
    
    for (const suggestion of suggestions) {
      try {
        // Find the warehouse material
        const warehouseMaterial = await prisma.warehousematerial.findFirst({
          where: {
            warehouseId,
            materialId: suggestion.materialId,
            isActive: true
          }
        });

        if (warehouseMaterial) {
          // Update the stock quantity
          const updatedMaterial = await prisma.warehousematerial.update({
            where: { id: warehouseMaterial.id },
            data: {
              quantity: suggestion.suggestedStock,
              updated_at: new Date()
            },
            include: {
              pricingconfig: true
            }
          });

          results.push({
            materialId: suggestion.materialId,
            materialName: suggestion.materialName,
            previousStock: suggestion.currentStock,
            newStock: suggestion.suggestedStock,
            stockAdded: suggestion.stockToAdd,
            success: true
          });
        } else {
          results.push({
            materialId: suggestion.materialId,
            materialName: suggestion.materialName,
            success: false,
            error: "Material not found in warehouse"
          });
        }
      } catch (error) {
        console.error(`Error updating material ${suggestion.materialId}:`, error);
        results.push({
          materialId: suggestion.materialId,
          materialName: suggestion.materialName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalProcessed: results.length,
          successful: successCount,
          failed: failureCount
        }
      },
      message: `Successfully applied ${successCount} stock suggestions${failureCount > 0 ? `, ${failureCount} failed` : ''}`
    });
  } catch (error) {
    console.error("Error applying smart stock suggestions:", error);
    return NextResponse.json(
      { error: "Failed to apply smart stock suggestions" },
      { status: 500 }
    );
  }
}
