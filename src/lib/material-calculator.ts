import { prisma } from "@/lib/prisma";
import type { Project } from "@/types/project";
import type { Decimal } from "@prisma/client/runtime/library";

export interface MaterialRequirement {
  materialId: string;
  category: string;
  name: string;
  label: string;
  quantity: number;
  unit: string;
  price: number;
  totalCost: number;
}

export interface ProjectMaterialCalculation {
  materials: MaterialRequirement[];
  totalCost: number;
  warehouseId?: string;
}

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

/**
 * Calculate required materials for a project based on its specifications
 */
export async function calculateProjectMaterials(project: Project | ProjectWithDecimals): Promise<ProjectMaterialCalculation> {
  const materials: MaterialRequirement[] = [];
  let totalCost = 0;

  // Get all active materials from pricing config
  const pricingconfigs = await prisma.pricingconfig.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' }
  });

  // Calculate materials based on project specifications
  const roofArea = Number(project.area);
  const gutterLength = Number(project.gutterLengthA || 0) + Number(project.gutterLengthC || 0);
  const ridgeLength = Number(project.ridgeLength || 0);

  // 1. Main roofing material
  const mainMaterial = pricingconfigs.find(pc => 
    pc.category === 'material' && 
    pc.name.toLowerCase().includes(project.material.toLowerCase())
  );
  
  if (mainMaterial) {
    const quantity = Math.ceil(roofArea * 1.1); // 10% waste factor
    const price = Number(mainMaterial.price);
    const totalCost = quantity * price;
    
    materials.push({
      materialId: mainMaterial.id,
      category: mainMaterial.category,
      name: mainMaterial.name,
      label: mainMaterial.label,
      quantity,
      unit: mainMaterial.unit,
      price,
      totalCost
    });
  }

  // 2. Gutter materials
  if (gutterLength > 0) {
    const gutterMaterial = pricingconfigs.find(pc => 
      pc.category === 'gutter' && 
      pc.name.toLowerCase().includes(project.gutterSize.toLowerCase())
    );
    
    if (gutterMaterial) {
      const quantity = Math.ceil(gutterLength * 1.05); // 5% waste factor
      const price = Number(gutterMaterial.price);
      const totalCost = quantity * price;
      
      materials.push({
        materialId: gutterMaterial.id,
        category: gutterMaterial.category,
        name: gutterMaterial.name,
        label: gutterMaterial.label,
        quantity,
        unit: gutterMaterial.unit,
        price,
        totalCost
      });
    }
  }

  // 3. Ridge materials
  if (ridgeLength > 0) {
    const ridgeMaterial = pricingconfigs.find(pc => 
      pc.category === 'ridge' && 
      pc.name.toLowerCase().includes(project.ridgeType.toLowerCase())
    );
    
    if (ridgeMaterial) {
      const quantity = Math.ceil(ridgeLength * 1.05); // 5% waste factor
      const price = Number(ridgeMaterial.price);
      const totalCost = quantity * price;
      
      materials.push({
        materialId: ridgeMaterial.id,
        category: ridgeMaterial.category,
        name: ridgeMaterial.name,
        label: ridgeMaterial.label,
        quantity,
        unit: ridgeMaterial.unit,
        price,
        totalCost
      });
    }
  }

  // 4. Screws/fasteners
  const screwMaterial = pricingconfigs.find(pc => 
    pc.category === 'screws'
  );
  
  if (screwMaterial) {
    // Estimate screws based on roof area (roughly 4 screws per sqm)
    const quantity = Math.ceil(roofArea * 4 * 1.1); // 10% waste factor
    const price = Number(screwMaterial.price);
    const totalCost = quantity * price;
    
    materials.push({
      materialId: screwMaterial.id,
      category: screwMaterial.category,
      name: screwMaterial.name,
      label: screwMaterial.label,
      quantity,
      unit: screwMaterial.unit,
      price,
      totalCost
    });
  }

  // 5. Insulation
  if (project.insulationThickness && project.insulationThickness !== 'none') {
    const insulationMaterial = pricingconfigs.find(pc => 
      pc.category === 'insulation' && 
      pc.name.toLowerCase().includes(project.insulationThickness.toLowerCase())
    );
    
    if (insulationMaterial) {
      const quantity = Math.ceil(roofArea * 1.1); // 10% waste factor
      const price = Number(insulationMaterial.price);
      const totalCost = quantity * price;
      
      materials.push({
        materialId: insulationMaterial.id,
        category: insulationMaterial.category,
        name: insulationMaterial.name,
        label: insulationMaterial.label,
        quantity,
        unit: insulationMaterial.unit,
        price,
        totalCost
      });
    }
  }

  // 6. Ventilation
  if (project.ventilationPieces > 0) {
    const ventilationMaterial = pricingconfigs.find(pc => 
      pc.category === 'ventilation'
    );
    
    if (ventilationMaterial) {
      const quantity = project.ventilationPieces;
      const price = Number(ventilationMaterial.price);
      const totalCost = quantity * price;
      
      materials.push({
        materialId: ventilationMaterial.id,
        category: ventilationMaterial.category,
        name: ventilationMaterial.name,
        label: ventilationMaterial.label,
        quantity,
        unit: ventilationMaterial.unit,
        price,
        totalCost
      });
    }
  }

  // 7. Labor
  const laborMaterial = pricingconfigs.find(pc => 
    pc.category === 'labor'
  );
  
  if (laborMaterial) {
    // Labor is typically fixed at 1 unit
    const quantity = 1;
    const price = Number(laborMaterial.price);
    const totalCost = quantity * price;
    
    materials.push({
      materialId: laborMaterial.id,
      category: laborMaterial.category,
      name: laborMaterial.name,
      label: laborMaterial.label,
      quantity,
      unit: laborMaterial.unit,
      price,
      totalCost
    });
  }

  // Calculate total cost
  totalCost = materials.reduce((sum, material) => sum + material.totalCost, 0);

  return {
    materials,
    totalCost,
    warehouseId: project.warehouseId || undefined
  };
}

/**
 * Get material requirements for a project by ID
 */
export async function getProjectMaterialRequirements(projectId: string): Promise<ProjectMaterialCalculation | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return null;
  }

  return calculateProjectMaterials(project);
}

/**
 * Find the best warehouse for a project based on material availability and location
 */
export async function findBestWarehouseForProject(project: Project | ProjectWithDecimals): Promise<string | null> {
  const materialCalculation = await calculateProjectMaterials(project);
  
  // Get all warehouses
  const warehouses = await prisma.warehouse.findMany({
    where: { isDefault: true }, // Start with default warehouses
    include: {
      warehousematerial: {
        where: { isActive: true },
        include: {
          pricingconfig: true
        }
      }
    }
  });

  // Find warehouse with best material availability
  let bestWarehouse: string | null = null;
  let bestAvailabilityScore = 0;

  for (const warehouse of warehouses) {
    let availabilityScore = 0;
    let totalMaterials = 0;

    for (const requiredMaterial of materialCalculation.materials) {
      totalMaterials++;
      
      const warehouseMaterial = warehouse.warehousematerial.find(
        wm => wm.materialId === requiredMaterial.materialId
      );

      if (warehouseMaterial && warehouseMaterial.quantity >= requiredMaterial.quantity) {
        availabilityScore += 1;
      } else if (warehouseMaterial && warehouseMaterial.quantity > 0) {
        // Partial availability
        const availabilityRatio = warehouseMaterial.quantity / requiredMaterial.quantity;
        availabilityScore += availabilityRatio;
      }
    }

    // Calculate percentage of materials available
    const availabilityPercentage = totalMaterials > 0 ? availabilityScore / totalMaterials : 0;

    if (availabilityPercentage > bestAvailabilityScore) {
      bestAvailabilityScore = availabilityPercentage;
      bestWarehouse = warehouse.id;
    }
  }

  return bestWarehouse;
}
