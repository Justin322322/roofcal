import { prisma } from "@/lib/prisma";
import { calculateProjectMaterials } from "./material-calculator";
import type { Project } from "@/types/project";
import type { Decimal } from "@prisma/client/runtime/library";
import type { ProjectMaterial, WarehouseMaterial, PricingConfig } from "@prisma/client";

// Type for project with Prisma Decimal fields
type ProjectWithDecimals = {
  id: string;
  area: Decimal;
  length: Decimal;
  width: Decimal;
  pitch: Decimal;
  material: string;
  roofType: string;
  gutterLengthA?: Decimal | null;
  gutterLengthC?: Decimal | null;
  ridgeLength?: Decimal | null;
  gutterSize: string;
  ridgeType: string;
  insulationThickness: string;
  ventilationPieces: number;
  warehouseId?: string | null;
  latitude?: Decimal | null;
  longitude?: Decimal | null;
  deliveryCost?: Decimal | null;
  deliveryDistance?: Decimal | null;
};

// Type for project material with warehouse material included
type ProjectMaterialWithWarehouse = ProjectMaterial & {
  WarehouseMaterial: WarehouseMaterial & {
    PricingConfig: PricingConfig | null;
  };
};

export interface MaterialAvailabilityCheck {
  isAvailable: boolean;
  insufficientMaterials: Array<{
    materialId: string;
    materialName: string;
    required: number;
    available: number;
    shortage: number;
  }>;
  warehouseId: string;
}

export interface MaterialConsumptionResult {
  success: boolean;
  message: string;
  consumedMaterials?: Array<{
    materialId: string;
    quantity: number;
    remainingStock: number;
  }>;
  error?: string;
}

/**
 * Validate if warehouse has sufficient materials for a project
 */
export async function validateMaterialAvailability(
  project: Project | ProjectWithDecimals,
  warehouseId?: string
): Promise<MaterialAvailabilityCheck> {
  const targetWarehouseId = warehouseId || project.warehouseId;
  
  if (!targetWarehouseId) {
    return {
      isAvailable: false,
      insufficientMaterials: [],
      warehouseId: ''
    };
  }

  const materialCalculation = await calculateProjectMaterials(project);
  const insufficientMaterials: MaterialAvailabilityCheck['insufficientMaterials'] = [];

  // Get warehouse materials
  const warehousematerials = await prisma.warehouseMaterial.findMany({
    where: {
      warehouseId: targetWarehouseId,
      isActive: true
    },
    include: {
      PricingConfig: true
    }
  });

  // Check availability for each required material
  for (const requiredMaterial of materialCalculation.materials) {
    const warehousematerial = warehousematerials.find(
      wm => wm.materialId === requiredMaterial.materialId
    );

    if (!warehousematerial) {
      insufficientMaterials.push({
        materialId: requiredMaterial.materialId,
        materialName: requiredMaterial.label,
        required: requiredMaterial.quantity,
        available: 0,
        shortage: requiredMaterial.quantity
      });
    } else if (warehousematerial.quantity < requiredMaterial.quantity) {
      insufficientMaterials.push({
        materialId: requiredMaterial.materialId,
        materialName: requiredMaterial.label,
        required: requiredMaterial.quantity,
        available: warehousematerial.quantity,
        shortage: requiredMaterial.quantity - warehousematerial.quantity
      });
    }
  }

  return {
    isAvailable: insufficientMaterials.length === 0,
    insufficientMaterials,
    warehouseId: targetWarehouseId
  };
}

/**
 * Reserve materials for a project (when status changes to ACCEPTED)
 */
export async function reserveProjectMaterials(
  projectId: string,
  warehouseId?: string
): Promise<MaterialConsumptionResult> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return {
        success: false,
        message: "Project not found",
        error: "PROJECT_NOT_FOUND"
      };
    }

    const targetWarehouseId = warehouseId || project.warehouseId;
    
    if (!targetWarehouseId) {
      return {
        success: false,
        message: "No warehouse assigned to project",
        error: "NO_WAREHOUSE"
      };
    }

    // Validate material availability
    const availability = await validateMaterialAvailability(project, targetWarehouseId);
    
    if (!availability.isAvailable) {
      const errorMessage = `Insufficient materials in warehouse. Missing: ${
        availability.insufficientMaterials.map(m => 
          `${m.materialName} (need ${m.required}, have ${m.available})`
        ).join(', ')
      }`;
      
      return {
        success: false,
        message: errorMessage,
        error: "INSUFFICIENT_MATERIALS"
      };
    }

    // Calculate required materials
    const materialCalculation = await calculateProjectMaterials(project);
    
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      const consumedMaterials: MaterialConsumptionResult['consumedMaterials'] = [];
      
      // Process each required material
      for (const requiredMaterial of materialCalculation.materials) {
        // Get or create warehouse material record
        let warehousematerial = await tx.warehouseMaterial.findFirst({
          where: {
            warehouseId: targetWarehouseId,
            materialId: requiredMaterial.materialId
          }
        });

        if (!warehousematerial) {
          // Create new warehouse material record
          warehousematerial = await tx.warehouseMaterial.create({
            data: {
              id: crypto.randomUUID(),
              warehouseId: targetWarehouseId,
              materialId: requiredMaterial.materialId,
              quantity: 0, // Start with 0 since we're consuming
              locationAdjustment: 0,
              isActive: true,
              updated_at: new Date()
            }
          });
        }

        // Check if materials are already reserved for this project
        const existingReservation = await tx.projectMaterial.findFirst({
          where: {
            projectId: projectId,
            warehouseMaterialId: warehousematerial.id
          }
        });

        if (existingReservation) {
          // Update existing reservation
          await tx.projectMaterial.update({
            where: { id: existingReservation.id },
            data: {
              quantity: requiredMaterial.quantity,
              status: 'RESERVED',
              reservedAt: new Date(),
              consumedAt: null,
              returnedAt: null
            }
          });
        } else {
          // Create new reservation
          await tx.projectMaterial.create({
            data: {
              id: crypto.randomUUID(),
              projectId: projectId,
              warehouseMaterialId: warehousematerial.id,
              quantity: requiredMaterial.quantity,
              status: 'RESERVED',
              reservedAt: new Date(),
              updated_at: new Date()
            }
          });
        }

        consumedMaterials.push({
          materialId: requiredMaterial.materialId,
          quantity: requiredMaterial.quantity,
          remainingStock: warehousematerial.quantity
        });
      }

      // Update project to mark materials as reserved
      await tx.project.update({
        where: { id: projectId },
        data: {
          materialsConsumed: true,
          materialsConsumedAt: new Date()
        }
      });

      return consumedMaterials;
    });

    return {
      success: true,
      message: `Successfully reserved materials for project`,
      consumedMaterials: result
    };

  } catch (error) {
    console.error('Error reserving project materials:', error);
    return {
      success: false,
      message: "Failed to reserve materials",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
    };
  }
}

/**
 * Consume materials from warehouse (when project starts work)
 */
export async function consumeProjectMaterials(
  projectId: string
): Promise<MaterialConsumptionResult> {
  try {
    // Get project materials that are reserved
    const projectmaterials = await prisma.projectMaterial.findMany({
      where: {
        projectId: projectId,
        status: 'RESERVED'
      },
      include: {
        WarehouseMaterial: {
          select: {
            id: true,
            materialId: true,
            quantity: true,
            PricingConfig: true
          }
        }
      }
    }) as ProjectMaterialWithWarehouse[];

    if (projectmaterials.length === 0) {
      return {
        success: false,
        message: "No reserved materials found for project",
        error: "NO_RESERVED_MATERIALS"
      };
    }

    // Start transaction to consume materials
    const result = await prisma.$transaction(async (tx) => {
      const consumedMaterials: MaterialConsumptionResult['consumedMaterials'] = [];
      
      for (const projectmaterial of projectmaterials) {
        // Check if warehouse has enough stock
        if (projectmaterial.WarehouseMaterial.quantity < projectmaterial.quantity) {
          throw new Error(
            `Insufficient stock for material ${projectmaterial.WarehouseMaterial.materialId}. ` +
            `Required: ${projectmaterial.quantity}, Available: ${projectmaterial.WarehouseMaterial.quantity}`
          );
        }

        // Deduct from warehouse stock
        const updatedWarehouseMaterial = await tx.warehouseMaterial.update({
          where: { id: projectmaterial.warehouseMaterialId },
          data: {
            quantity: {
              decrement: projectmaterial.quantity
            }
          }
        });

        // Mark as consumed
        await tx.projectMaterial.update({
          where: { id: projectmaterial.id },
          data: {
            status: 'CONSUMED',
            consumedAt: new Date()
          }
        });

        consumedMaterials.push({
          materialId: projectmaterial.WarehouseMaterial.materialId,
          quantity: projectmaterial.quantity,
          remainingStock: updatedWarehouseMaterial.quantity
        });
      }

      return consumedMaterials;
    });

    return {
      success: true,
      message: `Successfully consumed materials for project`,
      consumedMaterials: result
    };

  } catch (error) {
    console.error('Error consuming project materials:', error);
    return {
      success: false,
      message: "Failed to consume materials",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
    };
  }
}

/**
 * Return materials to warehouse (when project is cancelled/rejected)
 */
export async function returnProjectMaterials(
  projectId: string,
  reason?: string
): Promise<MaterialConsumptionResult> {
  try {
    // Get project materials
    const projectmaterials = await prisma.projectMaterial.findMany({
      where: {
        projectId: projectId,
        status: { in: ['RESERVED', 'CONSUMED'] }
      },
      include: {
        WarehouseMaterial: {
          select: {
            id: true,
            materialId: true,
            quantity: true,
            PricingConfig: true
          }
        }
      }
    }) as ProjectMaterialWithWarehouse[];

    if (projectmaterials.length === 0) {
      return {
        success: true,
        message: "No materials to return for project"
      };
    }

    // Start transaction to return materials
    const result = await prisma.$transaction(async (tx) => {
      const returnedMaterials: MaterialConsumptionResult['consumedMaterials'] = [];
      
      for (const projectmaterial of projectmaterials) {
        let newStatus: 'RETURNED' | 'CANCELLED' = 'RETURNED';
        
        // If materials were consumed, return them to warehouse
        if (projectmaterial.status === 'CONSUMED') {
          await tx.warehouseMaterial.update({
            where: { id: projectmaterial.warehouseMaterialId },
            data: {
              quantity: {
                increment: projectmaterial.quantity
              }
            }
          });
        } else {
          // If materials were only reserved, mark as cancelled
          newStatus = 'CANCELLED';
        }

        // Update project material status
        await tx.projectMaterial.update({
          where: { id: projectmaterial.id },
          data: {
            status: newStatus,
            returnedAt: new Date(),
            notes: reason || `Materials ${newStatus.toLowerCase()} on ${new Date().toISOString()}`
          }
        });

        // Get updated warehouse material quantity
        const updatedWarehouseMaterial = await tx.warehouseMaterial.findUnique({
          where: { id: projectmaterial.warehouseMaterialId }
        });

        returnedMaterials.push({
          materialId: projectmaterial.WarehouseMaterial.materialId,
          quantity: projectmaterial.quantity,
          remainingStock: updatedWarehouseMaterial?.quantity || 0
        });
      }

      // Update project to mark materials as not consumed
      await tx.project.update({
        where: { id: projectId },
        data: {
          materialsConsumed: false,
          materialsConsumedAt: null
        }
      });

      return returnedMaterials;
    });

    return {
      success: true,
      message: `Successfully returned materials for project`,
      consumedMaterials: result
    };

  } catch (error) {
    console.error('Error returning project materials:', error);
    return {
      success: false,
      message: "Failed to return materials",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
    };
  }
}

/**
 * Get material consumption summary for a project
 */
export async function getProjectMaterialSummary(projectId: string) {
  const projectmaterials = await prisma.projectMaterial.findMany({
    where: { projectId },
    include: {
      WarehouseMaterial: {
        include: {
          PricingConfig: true
        }
      }
    }
  }) as ProjectMaterialWithWarehouse[];

  const summary = {
    totalMaterials: projectmaterials.length,
    reservedMaterials: projectmaterials.filter((pm) => pm.status === 'RESERVED').length,
    consumedMaterials: projectmaterials.filter((pm) => pm.status === 'CONSUMED').length,
    returnedMaterials: projectmaterials.filter((pm) => pm.status === 'RETURNED').length,
    cancelledMaterials: projectmaterials.filter((pm) => pm.status === 'CANCELLED').length,
    materials: projectmaterials.map((pm) => ({
      id: pm.id,
      materialName: pm.WarehouseMaterial.PricingConfig?.label || 'Unknown',
      category: pm.WarehouseMaterial.PricingConfig?.category || 'Unknown',
      quantity: pm.quantity,
      status: pm.status,
      reservedAt: pm.reservedAt,
      consumedAt: pm.consumedAt,
      returnedAt: pm.returnedAt,
      notes: pm.notes
    }))
  };

  return summary;
}
