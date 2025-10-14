import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

export const runtime = 'nodejs';

// GET /api/warehouses/warnings - Get stock level warnings for all warehouses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only ADMIN and CLIENT roles can access warehouse warnings
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch all warehouses
    const warehouses = await prisma.warehouse.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    // Fetch all warehouse materials with their pricing config
    const warehouseMaterials = await prisma.warehouseMaterial.findMany({
      where: {
        isActive: true,
      },
      include: {
        PricingConfig: true,
      },
    });

    // Fetch all active projects to calculate reserved materials
    const activeProjects = await prisma.project.findMany({
      where: {
        status: {
          in: ['CLIENT_PENDING', 'IN_PROGRESS', 'CONTRACTOR_REVIEWING', 'PROPOSAL_SENT', 'ACCEPTED'],
        },
      },
      include: {
        ProjectMaterial: {
          include: {
            WarehouseMaterial: {
              include: {
                PricingConfig: true,
              },
            },
          },
        },
      },
    });

    // Calculate warnings for each warehouse
    const warnings = [];

    for (const warehouse of warehouses) {
      const warehouseWarnings = [];

      // Get materials for this warehouse
      const warehouseMaterialList = warehouseMaterials.filter(
        (wm) => wm.warehouseId === warehouse.id
      );

      for (const wm of warehouseMaterialList) {
        // Skip Labor materials - they are fixed costs, not physical inventory
        if (wm.PricingConfig.category.toLowerCase() === 'labor') {
          continue;
        }

        const currentStock = Number(wm.quantity);
        
        // Define warning thresholds based on material category
        let warningThreshold = 10; // Default threshold
        let criticalThreshold = 5; // Default critical threshold
        
        // Adjust thresholds based on material type
        if (wm.PricingConfig.category === 'Insulation' || wm.PricingConfig.category === 'Ventilation') {
          warningThreshold = 5;
          criticalThreshold = 2;
        } else if (wm.PricingConfig.category === 'Gutter') {
          warningThreshold = 15;
          criticalThreshold = 8;
        } else if (wm.PricingConfig.category === 'Screws' || wm.PricingConfig.category === 'Hardware') {
          warningThreshold = 20;
          criticalThreshold = 10;
        }

        // Calculate reserved quantity from active projects
        let reservedForProjects = 0;
        const projectsUsing = [];

        for (const project of activeProjects) {
          // Find if this project uses this material
          const projectMaterial = project.ProjectMaterial.find(
            (pm) => pm.WarehouseMaterial.materialId === wm.materialId
          );

          if (projectMaterial) {
            const quantity = Number(projectMaterial.quantity);
            reservedForProjects += quantity;
            projectsUsing.push({
              projectId: project.id,
              projectName: project.projectName || `Project ${project.id}`,
              quantity: quantity,
            });
          }
        }

        // Calculate projected stock (current - reserved)
        const projectedStock = Math.max(0, currentStock - reservedForProjects);

        // Check if material needs warning
        if (currentStock <= criticalThreshold || currentStock <= warningThreshold) {
          const isCritical = currentStock <= criticalThreshold;
          
          warehouseWarnings.push({
            materialId: wm.materialId,
            materialName: wm.PricingConfig.name,
            currentStock: currentStock,
            reservedForProjects: reservedForProjects,
            projectedStock: projectedStock,
            criticalLevel: isCritical,
            projectsUsing: projectsUsing,
          });
        }
      }

      // Only add warehouse to warnings if it has any warnings
      if (warehouseWarnings.length > 0) {
        warnings.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          warnings: warehouseWarnings,
        });
      }
    }

    return NextResponse.json({
      success: true,
      warnings: warnings,
    });
  } catch (error) {
    console.error("Error fetching warehouse warnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse warnings" },
      { status: 500 }
    );
  }
}

