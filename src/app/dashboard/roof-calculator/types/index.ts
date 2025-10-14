/**
 * TypeScript interfaces for Roof Calculator
 */

import type {
  MaterialRecommendation,
  ComplexityScore,
} from "@/lib/decision-tree";

export interface Measurements {
  length: string;
  width: string;
  pitch: string;
  roofType: string;
  floors: string;
  materialThickness: string;
  // Insulation
  insulationType?: "fiberglass-batt" | "foam-board" | "reflective-roll" | "spray-foam" | "mineral-wool";
  ridgeType: string;
  gutterSize: string;
  gutterMaterial?: string;
  budgetLevel: string;
  budgetAmount: string;
  constructionMode: "new" | "repair";
  // Gutter measurements
  gutterLengthA: string;
  gutterSlope: string;
  gutterLengthC: string;
  // Insulation
  insulationThickness: string;
  includeInsulation?: boolean;
  // Ventilation
  ventilationType?: "ridge-vent" | "turbine-vent" | "static-vent" | "soffit-vent" | "exhaust-fan";
  ventilationPieces: string;
  includeVentilation?: boolean;
  // Screw selection
  screwType: string;
}

export interface CalculationResults {
  area: number;
  materialCost: number;
  gutterCost: number;
  ridgeCost: number;
  screwsCost: number;
  insulationCost: number;
  ventilationCost: number;
  totalMaterialsCost: number;
  laborCost: number;
  removalCost: number;
  totalCost: number;
  gutterPieces: number;
  ridgeLength: number;
  materialQuantity: number;
  screwsQuantity: number;
}

export interface DecisionTreeResult {
  materialRecommendation: MaterialRecommendation;
  complexity: ComplexityScore;
  optimizationTips: string[];
}

export type { MaterialRecommendation, ComplexityScore };
