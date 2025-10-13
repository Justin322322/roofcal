import { prisma } from "@/lib/prisma";
import { calculateProjectMaterials } from "./material-calculator";
import type { Project } from "@/types/project";
import type { Decimal } from "@prisma/client/runtime/library";

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
  const warehouseMaterials = await prisma.warehouseMaterial.findMany({
    where: {
      warehouseId: targetWarehouseId,
      isActive: true
    },
    include: {
      pricingConfig: true
    }
  });

  // Check availability for each required material
  for (const requiredMaterial of materialCalculation.materials) {
    const warehouseMaterial = warehouseMaterials.find(
      wm => wm.materialId === requiredMaterial.materialId
    );

    if (!warehouseMaterial) {
      insufficientMaterials.push({
        materialId: requiredMaterial.materialId,
        materialName: requiredMaterial.label,
        required: requiredMaterial.quantity,
        available: 0,
        shortage: requiredMaterial.quantity
      });
    } else if (warehouseMaterial.quantity < requiredMaterial.quantity) {
      insufficientMaterials.push({
        materialId: requiredMaterial.materialId,
        materialName: requiredMaterial.label,
        required: requiredMaterial.quantity,
        available: warehouseMaterial.quantity,
        shortage: requiredMaterial.quantity - warehouseMaterial.quantity
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
        let warehouseMaterial = await tx.warehouseMaterial.findFirst({
          where: {
            warehouseId: targetWarehouseId,
            materialId: requiredMaterial.materialId
          }
        });

        if (!warehouseMaterial) {
          // Create new warehouse material record
          warehouseMaterial = await tx.warehouseMaterial.create({
            data: {
              warehouseId: targetWarehouseId,
              materialId: requiredMaterial.materialId,
              quantity: 0, // Start with 0 since we're consuming
              locationAdjustment: 0,
              isActive: true
            }
          });
        }

        // Check if materials are already reserved for this project
        const existingReservation = await tx.projectMaterial.findFirst({
          where: {
            projectId: projectId,
            warehouseMaterialId: warehouseMaterial.id
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
              projectId: projectId,
              warehouseMaterialId: warehouseMaterial.id,
              quantity: requiredMaterial.quantity,
              status: 'RESERVED',
              reservedAt: new Date()
            }
          });
        }

        consumedMaterials.push({
          materialId: requiredMaterial.materialId,
          quantity: requiredMaterial.quantity,
          remainingStock: warehouseMaterial.quantity
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
    const projectMaterials = await prisma.projectMaterial.findMany({
      where: {
        projectId: projectId,
        status: 'RESERVED'
      },
      include: {
        warehouseMaterial: true
      }
    });

    if (projectMaterials.length === 0) {
      return {
        success: false,
        message: "No reserved materials found for project",
        error: "NO_RESERVED_MATERIALS"
      };
    }

    // Start transaction to consume materials
    const result = await prisma.$transaction(async (tx) => {
      const consumedMaterials: MaterialConsumptionResult['consumedMaterials'] = [];
      
      for (const projectMaterial of projectMaterials) {
        // Check if warehouse has enough stock
        if (projectMaterial.warehouseMaterial.quantity < projectMaterial.quantity) {
          throw new Error(
            `Insufficient stock for material ${projectMaterial.warehouseMaterial.materialId}. ` +
            `Required: ${projectMaterial.quantity}, Available: ${projectMaterial.warehouseMaterial.quantity}`
          );
        }

        // Deduct from warehouse stock
        const updatedWarehouseMaterial = await tx.warehouseMaterial.update({
          where: { id: projectMaterial.warehouseMaterialId },
          data: {
            quantity: {
              decrement: projectMaterial.quantity
            }
          }
        });

        // Mark as consumed
        await tx.projectMaterial.update({
          where: { id: projectMaterial.id },
          data: {
            status: 'CONSUMED',
            consumedAt: new Date()
          }
        });

        consumedMaterials.push({
          materialId: projectMaterial.warehouseMaterial.materialId,
          quantity: projectMaterial.quantity,
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
    const projectMaterials = await prisma.projectMaterial.findMany({
      where: {
        projectId: projectId,
        status: { in: ['RESERVED', 'CONSUMED'] }
      },
      include: {
        warehouseMaterial: true
      }
    });

    if (projectMaterials.length === 0) {
      return {
        success: true,
        message: "No materials to return for project"
      };
    }

    // Start transaction to return materials
    const result = await prisma.$transaction(async (tx) => {
      const returnedMaterials: MaterialConsumptionResult['consumedMaterials'] = [];
      
      for (const projectMaterial of projectMaterials) {
        let newStatus: 'RETURNED' | 'CANCELLED' = 'RETURNED';
        
        // If materials were consumed, return them to warehouse
        if (projectMaterial.status === 'CONSUMED') {
          await tx.warehouseMaterial.update({
            where: { id: projectMaterial.warehouseMaterialId },
            data: {
              quantity: {
                increment: projectMaterial.quantity
              }
            }
          });
        } else {
          // If materials were only reserved, mark as cancelled
          newStatus = 'CANCELLED';
        }

        // Update project material status
        await tx.projectMaterial.update({
          where: { id: projectMaterial.id },
          data: {
            status: newStatus,
            returnedAt: new Date(),
            notes: reason || `Materials ${newStatus.toLowerCase()} on ${new Date().toISOString()}`
          }
        });

        // Get updated warehouse material quantity
        const updatedWarehouseMaterial = await tx.warehouseMaterial.findUnique({
          where: { id: projectMaterial.warehouseMaterialId }
        });

        returnedMaterials.push({
          materialId: projectMaterial.warehouseMaterial.materialId,
          quantity: projectMaterial.quantity,
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
  const projectMaterials = await prisma.projectMaterial.findMany({
    where: { projectId },
    include: {
      warehouseMaterial: {
        include: {
          pricingConfig: true
        }
      }
    }
  });

  const summary = {
    totalMaterials: projectMaterials.length,
    reservedMaterials: projectMaterials.filter(pm => pm.status === 'RESERVED').length,
    consumedMaterials: projectMaterials.filter(pm => pm.status === 'CONSUMED').length,
    returnedMaterials: projectMaterials.filter(pm => pm.status === 'RETURNED').length,
    cancelledMaterials: projectMaterials.filter(pm => pm.status === 'CANCELLED').length,
    materials: projectMaterials.map(pm => ({
      id: pm.id,
      materialName: pm.warehouseMaterial.pricingConfig.label,
      category: pm.warehouseMaterial.pricingConfig.category,
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
