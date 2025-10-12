/**
 * Constants for Roof Calculator
 */

// Fallback constants for backwards compatibility when database is unavailable
const FALLBACK_MATERIAL_PRICES = {
  asphalt: 450,
  metal: 1200,
  tile: 1800,
  slate: 2500,
  wood: 900,
  corrugated: 800,
} as const;

const FALLBACK_GUTTER_PRICES = {
  standard: 350, // 5 inch
  large: 450, // 6 inch
} as const;

const FALLBACK_RIDGE_PRICES = {
  asphalt: 150,
  metal: 200,
  tile: 250,
  slate: 300,
  wood: 180,
  corrugated: 180,
} as const;

const FALLBACK_SCREWS_PRICE_PER_SQM = {
  asphalt: 15,
  metal: 25,
  tile: 20,
  slate: 20,
  wood: 18,
  corrugated: 20,
} as const;

const FALLBACK_INSULATION_PRICES = {
  "5mm": 80,
  "10mm": 120,
  "15mm": 160,
  "20mm": 200,
  "25mm": 240,
} as const;

const FALLBACK_VENTILATION_PRICE_PER_PIECE = 850;

const FALLBACK_LABOR_COST_NEW_CONSTRUCTION = 0.4; // 40%
const FALLBACK_LABOR_COST_REPAIR = 0.2; // 20%

// Dynamic pricing will be loaded from database
export let MATERIAL_PRICES = FALLBACK_MATERIAL_PRICES;
export let GUTTER_PRICES = FALLBACK_GUTTER_PRICES;
export let RIDGE_PRICES = FALLBACK_RIDGE_PRICES;
export let SCREWS_PRICE_PER_SQM = FALLBACK_SCREWS_PRICE_PER_SQM;
export let INSULATION_PRICES = FALLBACK_INSULATION_PRICES;
export let VENTILATION_PRICE_PER_PIECE = FALLBACK_VENTILATION_PRICE_PER_PIECE;
export let LABOR_COST_NEW_CONSTRUCTION = FALLBACK_LABOR_COST_NEW_CONSTRUCTION;
export let LABOR_COST_REPAIR = FALLBACK_LABOR_COST_REPAIR;

/**
 * Update pricing constants from database data
 */
export function updatePricingConstants(pricingData: {
  MATERIAL_PRICES: Record<string, number>;
  GUTTER_PRICES: Record<string, number>;
  RIDGE_PRICES: Record<string, number>;
  SCREWS_PRICE_PER_SQM: Record<string, number>;
  INSULATION_PRICES: Record<string, number>;
  VENTILATION_PRICE_PER_PIECE: number;
  LABOR_COST_NEW_CONSTRUCTION: number;
  LABOR_COST_REPAIR: number;
}) {
  MATERIAL_PRICES = { ...FALLBACK_MATERIAL_PRICES, ...pricingData.MATERIAL_PRICES };
  GUTTER_PRICES = { ...FALLBACK_GUTTER_PRICES, ...pricingData.GUTTER_PRICES };
  RIDGE_PRICES = { ...FALLBACK_RIDGE_PRICES, ...pricingData.RIDGE_PRICES };
  SCREWS_PRICE_PER_SQM = { ...FALLBACK_SCREWS_PRICE_PER_SQM, ...pricingData.SCREWS_PRICE_PER_SQM };
  INSULATION_PRICES = { ...FALLBACK_INSULATION_PRICES, ...pricingData.INSULATION_PRICES };
  VENTILATION_PRICE_PER_PIECE = pricingData.VENTILATION_PRICE_PER_PIECE || FALLBACK_VENTILATION_PRICE_PER_PIECE;
  LABOR_COST_NEW_CONSTRUCTION = pricingData.LABOR_COST_NEW_CONSTRUCTION || FALLBACK_LABOR_COST_NEW_CONSTRUCTION;
  LABOR_COST_REPAIR = pricingData.LABOR_COST_REPAIR || FALLBACK_LABOR_COST_REPAIR;
}

/**
 * Reset pricing constants to fallback values
 */
export function resetPricingConstants() {
  MATERIAL_PRICES = FALLBACK_MATERIAL_PRICES;
  GUTTER_PRICES = FALLBACK_GUTTER_PRICES;
  RIDGE_PRICES = FALLBACK_RIDGE_PRICES;
  SCREWS_PRICE_PER_SQM = FALLBACK_SCREWS_PRICE_PER_SQM;
  INSULATION_PRICES = FALLBACK_INSULATION_PRICES;
  VENTILATION_PRICE_PER_PIECE = FALLBACK_VENTILATION_PRICE_PER_PIECE;
  LABOR_COST_NEW_CONSTRUCTION = FALLBACK_LABOR_COST_NEW_CONSTRUCTION;
  LABOR_COST_REPAIR = FALLBACK_LABOR_COST_REPAIR;
}

// Budget validation (minimum cost per square meter)
export const MIN_COST_PER_SQM = {
  asphalt: 800, // Material + labor + minimal extras
  metal: 1500,
  tile: 2200,
  slate: 3000,
  wood: 1200,
  corrugated: 1100,
} as const;

// Gutter calculation constant
export const GUTTER_DIVISOR = 2.3;
