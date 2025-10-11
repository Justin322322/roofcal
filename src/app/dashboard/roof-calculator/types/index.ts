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
  ridgeType: string;
  gutterSize: string;
  budgetLevel: string;
}

export interface CalculationResults {
  area: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

export interface DecisionTreeResult {
  materialRecommendation: MaterialRecommendation;
  complexity: ComplexityScore;
  optimizationTips: string[];
}

export type { MaterialRecommendation, ComplexityScore };
