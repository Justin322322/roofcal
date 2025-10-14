/**
 * Constants for Roof Calculator
 */

// Fallback constants for backwards compatibility when database is unavailable
const FALLBACK_MATERIAL_PRICES = {
  corrugated: 800,
} as const;

const FALLBACK_GUTTER_PRICES: Record<string, number> = {
  "cut-16": 350, // 16 inches
  "cut-24": 450, // 24 inches
  // Legacy support
  standard: 350,
  large: 450,
};

const FALLBACK_RIDGE_PRICES = {
  corrugated: 180,
  standard: 180,
  ventilated: 220,
} as const;

const FALLBACK_SCREWS_PRICE_PER_SQM = {
  corrugated: 20,
} as const;

const FALLBACK_SCREW_TYPES = {
  "self-drilling-hex": { name: "Self-Drilling Hex Head", price: 5.00 },
  "self-tapping-hex": { name: "Self-Tapping Hex Head", price: 6.00 },
  "roofing-with-washer": { name: "Roofing Screw with Washer", price: 4.50 },
  "tek-screw": { name: "TEK Screw", price: 7.00 },
  "concrete-screw": { name: "Concrete Screw", price: 8.00 },
  "tile-screw": { name: "Tile Screw", price: 6.50 },
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
export let SCREW_TYPES = FALLBACK_SCREW_TYPES;
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
  SCREW_TYPES?: Record<string, { name: string; price: number }>;
  INSULATION_PRICES: Record<string, number>;
  VENTILATION_PRICE_PER_PIECE: number;
  LABOR_COST_NEW_CONSTRUCTION: number;
  LABOR_COST_REPAIR: number;
}) {
  MATERIAL_PRICES = { ...FALLBACK_MATERIAL_PRICES, ...pricingData.MATERIAL_PRICES };
  GUTTER_PRICES = { ...FALLBACK_GUTTER_PRICES, ...pricingData.GUTTER_PRICES };
  RIDGE_PRICES = { ...FALLBACK_RIDGE_PRICES, ...pricingData.RIDGE_PRICES };
  SCREWS_PRICE_PER_SQM = { ...FALLBACK_SCREWS_PRICE_PER_SQM, ...pricingData.SCREWS_PRICE_PER_SQM };
  SCREW_TYPES = { ...FALLBACK_SCREW_TYPES, ...pricingData.SCREW_TYPES };
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
  SCREW_TYPES = FALLBACK_SCREW_TYPES;
  INSULATION_PRICES = FALLBACK_INSULATION_PRICES;
  VENTILATION_PRICE_PER_PIECE = FALLBACK_VENTILATION_PRICE_PER_PIECE;
  LABOR_COST_NEW_CONSTRUCTION = FALLBACK_LABOR_COST_NEW_CONSTRUCTION;
  LABOR_COST_REPAIR = FALLBACK_LABOR_COST_REPAIR;
}

// Budget validation (minimum cost per square meter)
export const MIN_COST_PER_SQM = {
  corrugated: 1100,
} as const;

// Gutter calculation constant
export const GUTTER_DIVISOR = 2.3;

// Pitch-based slope multipliers (derived from screenshot rules)
// Keys are degrees; values are multipliers applied to plan area
export const PITCH_SLOPE_MULTIPLIER: Record<number, number> = {
  5: 1.01,
  10: 1.02,
  15: 1.03,
  20: 1.04,
  25: 1.05,
  30: 1.06,
  35: 1.08,
  40: 1.1,
  45: 1.13,
  50: 1.17,
  60: 1.25,
};

/**
 * Get the slope multiplier for a given pitch in degrees.
 * Rounds to the nearest known key from PITCH_SLOPE_MULTIPLIER; defaults to 1.
 */
export function getSlopeMultiplier(pitchDegrees: number): number {
  if (!isFinite(pitchDegrees)) return 1;
  const keys = Object.keys(PITCH_SLOPE_MULTIPLIER)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  // If exact match
  if (pitchDegrees in PITCH_SLOPE_MULTIPLIER) {
    return PITCH_SLOPE_MULTIPLIER[pitchDegrees as keyof typeof PITCH_SLOPE_MULTIPLIER];
  }

  // Find nearest degree key
  let nearest = keys[0];
  let minDiff = Math.abs(pitchDegrees - nearest);
  for (let i = 1; i < keys.length; i++) {
    const diff = Math.abs(pitchDegrees - keys[i]);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = keys[i];
    }
  }
  return PITCH_SLOPE_MULTIPLIER[nearest];
}
