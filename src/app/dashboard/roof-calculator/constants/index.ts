/**
 * Constants for Roof Calculator
 */

// Material prices per square meter
export const MATERIAL_PRICES = {
  asphalt: 450,
  metal: 1200,
  tile: 1800,
  slate: 2500,
  wood: 900,
} as const;

// Gutter prices per piece
export const GUTTER_PRICES = {
  standard: 350, // 5 inch
  large: 450, // 6 inch
} as const;

// Ridge prices per linear meter (matches roof material type)
export const RIDGE_PRICES = {
  asphalt: 150,
  metal: 200,
  tile: 250,
  slate: 300,
  wood: 180,
} as const;

// Screws pricing (per square meter of roof)
export const SCREWS_PRICE_PER_SQM = {
  asphalt: 15,
  metal: 25,
  tile: 20,
  slate: 20,
  wood: 18,
} as const;

// Insulation prices per square meter by thickness
export const INSULATION_PRICES = {
  "5mm": 80,
  "10mm": 120,
  "15mm": 160,
  "20mm": 200,
  "25mm": 240,
} as const;

// Ventilation prices per piece
export const VENTILATION_PRICE_PER_PIECE = 850;

// Labor cost percentages
export const LABOR_COST_NEW_CONSTRUCTION = 0.4; // 40%
export const LABOR_COST_REPAIR = 0.2; // 20%

// Budget validation (minimum cost per square meter)
export const MIN_COST_PER_SQM = {
  asphalt: 800, // Material + labor + minimal extras
  metal: 1500,
  tile: 2200,
  slate: 3000,
  wood: 1200,
} as const;

// Gutter calculation constant
export const GUTTER_DIVISOR = 2.3;
