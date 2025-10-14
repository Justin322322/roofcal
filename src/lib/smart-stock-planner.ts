import { prisma } from './prisma';

export interface StockSuggestion {
  materialId: string;
  materialName: string;
  currentStock: number;
  suggestedStock: number;
  stockToAdd: number;
  reason: string;
  priority: 'critical' | 'warning' | 'optimization';
  confidence: number; // 0-1, how confident we are in this suggestion
}

export interface WarehouseCapacityInfo {
  warehouseId: string;
  totalCapacity: number; // in cubic meters
  usedCapacity: number; // in cubic meters
  availableCapacity: number; // in cubic meters
}

export interface MaterialVolumeInfo {
  materialId: string;
  length?: number; // in meters
  width?: number; // in meters  
  height?: number; // in meters
  volume?: number; // in cubic meters per unit
}

/**
 * Calculate the volume of a single unit of material
 */
function calculateMaterialVolume(material: MaterialVolumeInfo): number {
  // Use explicit volume if available
  if (material.volume && material.volume > 0) {
    return material.volume;
  }
  
  // Calculate from dimensions if available
  if (material.length && material.width && material.height) {
    return material.length * material.width * material.height;
  }
  
  // Default fallback volume (very small unit)
  return 0.001; // 1 liter default
}

/**
 * Calculate optimal stock levels based on demand patterns and capacity constraints
 */
export async function calculateSmartStockSuggestions(
  warehouseId: string,
  warnings: Array<{
    materialId: string;
    materialName: string;
    currentStock: number;
    reservedForProjects: number;
    projectedStock: number;
    criticalLevel: boolean;
    projectsUsing: Array<{
      projectId: string;
      projectName: string;
      quantity: number;
    }>;
  }>
): Promise<StockSuggestion[]> {
  try {
    // Get warehouse capacity information
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { capacity: true }
    });

    if (!warehouse?.capacity) {
      throw new Error('Warehouse capacity not defined');
    }

    // Get material volume information
    const materials = await prisma.pricingConfig.findMany({
      where: {
        id: { in: warnings.map(w => w.materialId) },
        category: 'materials'
      },
      select: {
        id: true,
        name: true,
        label: true,
        length: true,
        width: true,
        height: true,
        volume: true
      }
    });

    const materialVolumeMap = new Map(
      materials.map(m => [m.id, {
        materialId: m.id,
        length: m.length ? Number(m.length) : undefined,
        width: m.width ? Number(m.width) : undefined,
        height: m.height ? Number(m.height) : undefined,
        volume: m.volume ? Number(m.volume) : undefined
      }])
    );

    // Calculate current capacity usage
    const warehouseMaterials = await prisma.warehouseMaterial.findMany({
      where: { warehouseId, isActive: true },
      include: { PricingConfig: true }
    });

    let usedCapacity = 0;
    warehouseMaterials.forEach(wm => {
      const volumeInfo = materialVolumeMap.get(wm.materialId);
      if (volumeInfo) {
        const unitVolume = calculateMaterialVolume({
          materialId: wm.materialId,
          length: wm.PricingConfig.length ? Number(wm.PricingConfig.length) : undefined,
          width: wm.PricingConfig.width ? Number(wm.PricingConfig.width) : undefined,
          height: wm.PricingConfig.height ? Number(wm.PricingConfig.height) : undefined,
          volume: wm.PricingConfig.volume ? Number(wm.PricingConfig.volume) : undefined,
        });
        usedCapacity += wm.quantity * unitVolume;
      }
    });

    const totalCapacity = Number(warehouse.capacity) || 0;
    const availableCapacity = totalCapacity - usedCapacity;
    const capacityInfo: WarehouseCapacityInfo = {
      warehouseId,
      totalCapacity,
      usedCapacity,
      availableCapacity: Math.max(0, availableCapacity)
    };

    // Generate stock suggestions
    const suggestions: StockSuggestion[] = [];

    for (const warning of warnings) {
      const volumeInfo = materialVolumeMap.get(warning.materialId);
      if (!volumeInfo) continue;

      const unitVolume = calculateMaterialVolume(volumeInfo);
      
      // Calculate demand-based suggestion
      let suggestedStock = calculateDemandBasedStock(warning);
      
      // Apply capacity constraints
      const maxStockByCapacity = Math.floor(capacityInfo.availableCapacity / unitVolume);
      
      if (suggestedStock > maxStockByCapacity) {
        suggestedStock = maxStockByCapacity;
      }

      // Ensure minimum viable stock
      const minStock = Math.max(warning.reservedForProjects * 1.5, 10);
      suggestedStock = Math.max(suggestedStock, minStock);

      // Calculate stock to add
      const stockToAdd = Math.max(0, suggestedStock - warning.currentStock);
      
      if (stockToAdd > 0) {
        suggestions.push({
          materialId: warning.materialId,
          materialName: warning.materialName,
          currentStock: warning.currentStock,
          suggestedStock,
          stockToAdd,
          reason: generateSuggestionReason(warning, suggestedStock, capacityInfo),
          priority: warning.criticalLevel ? 'critical' : 'warning',
          confidence: calculateConfidence(warning, suggestedStock, capacityInfo)
        });
      }
    }

    // Sort by priority and confidence
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 3, warning: 2, optimization: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });

  } catch (error) {
    console.error('Error calculating smart stock suggestions:', error);
    return [];
  }
}

/**
 * Calculate demand-based stock suggestion
 */
function calculateDemandBasedStock(warning: {
  reservedForProjects: number;
  projectedStock: number;
  projectsUsing: Array<{ quantity: number }>;
}): number {
  // Base suggestion on reserved quantity plus safety buffer
  const reservedQuantity = warning.reservedForProjects;
  
  // Calculate average project usage
  const totalProjectUsage = warning.projectsUsing.reduce((sum, p) => sum + p.quantity, 0);
  const avgProjectUsage = warning.projectsUsing.length > 0 ? totalProjectUsage / warning.projectsUsing.length : 0;
  
  // Safety buffer: 2x reserved + 1x average project usage
  const safetyBuffer = reservedQuantity * 2 + avgProjectUsage;
  
  // Add growth factor (20% extra for future projects)
  const growthFactor = safetyBuffer * 0.2;
  
  return Math.ceil(reservedQuantity + safetyBuffer + growthFactor);
}

/**
 * Generate human-readable reason for the suggestion
 */
function generateSuggestionReason(
  warning: { criticalLevel: boolean; reservedForProjects: number; projectsUsing: unknown[] },
  suggestedStock: number,
  capacityInfo: WarehouseCapacityInfo
): string {
  const reasons: string[] = [];
  
  if (warning.criticalLevel) {
    reasons.push('Critical stock level detected');
  }
  
  if (warning.reservedForProjects > 0) {
    reasons.push(`${warning.reservedForProjects} units reserved for active projects`);
  }
  
  if (warning.projectsUsing.length > 0) {
    reasons.push(`Used by ${warning.projectsUsing.length} project(s)`);
  }
  
  const capacityUtilization = (capacityInfo.usedCapacity / capacityInfo.totalCapacity) * 100;
  if (capacityUtilization > 80) {
    reasons.push('High warehouse capacity utilization');
  }
  
  return reasons.join(', ');
}

/**
 * Calculate confidence score for the suggestion (0-1)
 */
function calculateConfidence(
  warning: { criticalLevel: boolean; reservedForProjects: number; projectsUsing: unknown[] },
  suggestedStock: number,
  capacityInfo: WarehouseCapacityInfo
): number {
  let confidence = 0.5; // Base confidence
  
  // Higher confidence for critical items
  if (warning.criticalLevel) {
    confidence += 0.3;
  }
  
  // Higher confidence when we have project data
  if (warning.projectsUsing.length > 0) {
    confidence += 0.2;
  }
  
  // Lower confidence if we're near capacity limits
  const capacityUtilization = (capacityInfo.usedCapacity / capacityInfo.totalCapacity) * 100;
  if (capacityUtilization > 90) {
    confidence -= 0.2;
  }
  
  return Math.max(0, Math.min(1, confidence));
}
