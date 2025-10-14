import { prisma } from "./prisma";
import { z } from "zod";

// Type definitions for pricing categories
export const PRICING_CATEGORIES = [
  "materials",
  "gutters", 
  "ridges",
  "screws",
  "screw_types",
  "insulation",
  "ventilation",
  "labor"
] as const;

export const PRICING_UNITS = [
  "per_sqm",
  "per_piece", 
  "per_meter",
  "percentage"
] as const;

export type PricingCategory = typeof PRICING_CATEGORIES[number];
export type PricingUnit = typeof PRICING_UNITS[number];

import { Decimal } from "@prisma/client/runtime/library";

// Database result type (what Prisma returns)
interface PricingConfigDBResult {
  id: string;
  category: string;
  name: string;
  label: string;
  description: string | null;
  price: Decimal; // Prisma returns Decimal for decimal fields
  unit: string;
  isActive: boolean;
  metadata: string | null;
  created_at: Date;
  updated_at: Date;
}


// Zod schemas for validation
export const PricingConfigSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(PRICING_CATEGORIES),
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.enum(PRICING_UNITS),
  isActive: z.boolean().default(true),
  metadata: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreatePricingConfigSchema = z.object({
  category: z.enum(PRICING_CATEGORIES),
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.enum(PRICING_UNITS),
  metadata: z.string().optional(),
});

export const UpdatePricingConfigSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  unit: z.enum(PRICING_UNITS).optional(),
  isActive: z.boolean().optional(),
  metadata: z.string().optional(),
});

export type PricingConfig = z.infer<typeof PricingConfigSchema>;
export type CreatePricingConfig = z.infer<typeof CreatePricingConfigSchema>;
export type UpdatePricingConfig = z.infer<typeof UpdatePricingConfigSchema>;

// In-memory cache for pricing data (5 minute TTL)
const pricingCache = new Map<string, { data: PricingConfig[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch pricing configurations from database with caching
 */
export async function getPricingConfig(category?: PricingCategory): Promise<PricingConfig[]> {
  const cacheKey = category || 'all' as string;
  const cached = pricingCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch from database
  const where = category ? { category, isActive: true } : { isActive: true };
  const data = await prisma.pricingConfig.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  // Convert Decimal to number for JSON serialization and ensure proper types
  const formattedData = data.map((item: PricingConfigDBResult) => ({
    ...item,
    price: Number(item.price),
    category: item.category as PricingCategory,
    unit: item.unit as PricingUnit,
    description: item.description ?? undefined,
    metadata: item.metadata ?? undefined,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  // Cache the result
  pricingCache.set(cacheKey, {
    data: formattedData,
    timestamp: Date.now()
  });

  return formattedData;
}

/**
 * Get material prices in format compatible with existing calculator
 */
export async function getMaterialPrices() {
  const materials = await getPricingConfig('materials');
  
  return materials.map(material => ({
    value: material.name,
    name: material.label,
    price: material.price,
    description: material.description || '',
  }));
}

/**
 * Get pricing configuration mapped to constants format
 */
export async function getPricingConstants() {
  const [materials, gutters, ridges, screws, insulation, ventilation, labor] = await Promise.all([
    getPricingConfig('materials'),
    getPricingConfig('gutters'),
    getPricingConfig('ridges'),
    getPricingConfig('screws'),
    getPricingConfig('insulation'),
    getPricingConfig('ventilation'),
    getPricingConfig('labor'),
  ]);

  // Map materials to key-value pairs
  const materialPrices: Record<string, number> = {};
  materials.forEach(material => {
    materialPrices[material.name] = material.price;
  });

  // Map gutters
  const gutterPrices: Record<string, number> = {};
  gutters.forEach(gutter => {
    gutterPrices[gutter.name] = gutter.price;
  });

  // Map ridges
  const ridgePrices: Record<string, number> = {};
  ridges.forEach(ridge => {
    ridgePrices[ridge.name] = ridge.price;
  });

  // Map screws
  const screwsPrices: Record<string, number> = {};
  screws.forEach(screw => {
    screwsPrices[screw.name] = screw.price;
  });

  // Map insulation
  const insulationPrices: Record<string, number> = {};
  insulation.forEach(item => {
    insulationPrices[item.name] = item.price;
  });

  // Map ventilation (single value)
  const ventilationPrice = ventilation[0]?.price || 850;

  // Map labor rates
  const laborRates: Record<string, number> = {};
  labor.forEach(rate => {
    laborRates[rate.name] = rate.price;
  });

  return {
    MATERIAL_PRICES: materialPrices,
    GUTTER_PRICES: gutterPrices,
    RIDGE_PRICES: ridgePrices,
    SCREWS_PRICE_PER_SQM: screwsPrices,
    INSULATION_PRICES: insulationPrices,
    VENTILATION_PRICE_PER_PIECE: ventilationPrice,
    LABOR_COST_NEW_CONSTRUCTION: laborRates['new_construction'] || 0.4,
    LABOR_COST_REPAIR: laborRates['repair'] || 0.2,
  };
}

/**
 * Create a new pricing configuration
 */
export async function createPricingConfig(data: CreatePricingConfig): Promise<PricingConfig> {
  // Validate input
  const validatedData = CreatePricingConfigSchema.parse(data);

  // Check if pricing config with same category and name already exists
  const existing = await prisma.pricingConfig.findUnique({
    where: {
      category_name: {
        category: validatedData.category,
        name: validatedData.name,
      }
    }
  });

  if (existing) {
    throw new Error(`Pricing configuration with category "${validatedData.category}" and name "${validatedData.name}" already exists`);
  }

  // Create new pricing config
  const created = await prisma.pricingConfig.create({
    data: {
      ...validatedData,
      id: crypto.randomUUID(),
      updated_at: new Date(),
    }
  });

  // Clear cache for this category
  clearPricingCache(validatedData.category);
  clearPricingCache('all' as string);

  return {
    ...created,
    price: Number(created.price),
    category: created.category as PricingCategory,
    unit: created.unit as PricingUnit,
    description: created.description ?? undefined,
    metadata: created.metadata ?? undefined,
  };
}

/**
 * Update an existing pricing configuration
 */
export async function updatePricingConfig(id: string, data: UpdatePricingConfig): Promise<PricingConfig> {
  // Validate input
  const validatedData = UpdatePricingConfigSchema.parse(data);

  // Check if pricing config exists
  const existing = await prisma.pricingConfig.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new Error(`Pricing configuration with id "${id}" not found`);
  }

  // Update pricing config
  const updated = await prisma.pricingConfig.update({
    where: { id },
    data: validatedData,
  });

  // Clear cache for this category
  clearPricingCache(existing.category);
  clearPricingCache('all' as string);

  return {
    ...updated,
    price: Number(updated.price),
    category: updated.category as PricingCategory,
    unit: updated.unit as PricingUnit,
    description: updated.description ?? undefined,
    metadata: updated.metadata ?? undefined,
  };
}

/**
 * Delete/deactivate a pricing configuration
 */
export async function deletePricingConfig(id: string): Promise<void> {
  // Check if pricing config exists
  const existing = await prisma.pricingConfig.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new Error(`Pricing configuration with id "${id}" not found`);
  }

  // Soft delete by setting isActive to false
  await prisma.pricingConfig.update({
    where: { id },
    data: { isActive: false }
  });

  // Clear cache for this category
  clearPricingCache(existing.category);
  clearPricingCache('all' as string);
}

/**
 * Clear pricing cache for a specific category or all
 */
function clearPricingCache(category?: PricingCategory | string) {
  if (category) {
    pricingCache.delete(category);
  } else {
    pricingCache.clear();
  }
}

/**
 * Get pricing categories configuration
 */
export function getPricingCategories() {
  return [
    { id: "materials", label: "Roofing Materials", unit: "per_sqm" as PricingUnit },
    { id: "gutters", label: "Gutters", unit: "per_piece" as PricingUnit },
    { id: "ridges", label: "Ridge Caps", unit: "per_meter" as PricingUnit },
    { id: "screws", label: "Screws & Fasteners", unit: "per_sqm" as PricingUnit },
    { id: "insulation", label: "Insulation", unit: "per_sqm" as PricingUnit },
    { id: "ventilation", label: "Ventilation", unit: "per_piece" as PricingUnit },
    { id: "labor", label: "Labor Rates", unit: "percentage" as PricingUnit },
  ];
}
