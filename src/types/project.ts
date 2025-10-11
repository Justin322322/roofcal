/**
 * Project-related TypeScript interfaces and types
 */

import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "@/app/dashboard/roof-calculator/types";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type ConstructionMode = "NEW" | "REPAIR";

export interface Project {
  id: string;
  userId: string;
  projectName: string;
  clientName?: string;
  status: ProjectStatus;

  // Roof Measurements
  length: number;
  width: number;
  pitch: number;
  roofType: string;
  floors: number;
  materialThickness: string;
  ridgeType: string;
  gutterSize: string;
  budgetLevel: string;
  budgetAmount?: number;
  constructionMode: ConstructionMode;
  gutterLengthA?: number;
  gutterSlope?: number;
  gutterLengthC?: number;
  insulationThickness: string;
  ventilationPieces: number;

  // Material Selection
  material: string;

  // Calculation Results
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

  // Decision Tree Results
  complexityScore: number;
  complexityLevel: string;
  recommendedMaterial?: string;
  optimizationTips?: string;

  // Metadata
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  projectName: string;
  clientName?: string;
  status?: ProjectStatus;

  // All measurement fields
  length: number;
  width: number;
  pitch: number;
  roofType: string;
  floors: number;
  materialThickness: string;
  ridgeType: string;
  gutterSize: string;
  budgetLevel: string;
  budgetAmount?: number;
  constructionMode: ConstructionMode;
  gutterLengthA?: number;
  gutterSlope?: number;
  gutterLengthC?: number;
  insulationThickness: string;
  ventilationPieces: number;

  // Material Selection
  material: string;

  // Calculation Results
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

  // Decision Tree Results
  complexityScore: number;
  complexityLevel: string;
  recommendedMaterial?: string;
  optimizationTips?: string;

  // Metadata
  notes?: string;
}

export interface UpdateProjectInput {
  projectName?: string;
  clientName?: string;
  status?: ProjectStatus;

  // Allow updating measurements and results
  length?: number;
  width?: number;
  pitch?: number;
  roofType?: string;
  floors?: number;
  materialThickness?: string;
  ridgeType?: string;
  gutterSize?: string;
  budgetLevel?: string;
  budgetAmount?: number;
  constructionMode?: ConstructionMode;
  gutterLengthA?: number;
  gutterSlope?: number;
  gutterLengthC?: number;
  insulationThickness?: string;
  ventilationPieces?: number;

  material?: string;

  // Recalculated results
  area?: number;
  materialCost?: number;
  gutterCost?: number;
  ridgeCost?: number;
  screwsCost?: number;
  insulationCost?: number;
  ventilationCost?: number;
  totalMaterialsCost?: number;
  laborCost?: number;
  removalCost?: number;
  totalCost?: number;
  gutterPieces?: number;
  ridgeLength?: number;

  complexityScore?: number;
  complexityLevel?: string;
  recommendedMaterial?: string;
  optimizationTips?: string;

  notes?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  sortBy?: "created_at" | "updated_at" | "projectName" | "totalCost" | "area";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalValue: number;
  averageProjectValue: number;
}

// Helper type for converting calculator data to project format
export interface ProjectFromCalculator {
  measurements: Measurements;
  results: CalculationResults;
  decisionTree: DecisionTreeResult;
  material: string;
  projectName: string;
  clientName?: string;
  notes?: string;
}

// Helper type for converting project data back to calculator format
export interface ProjectToCalculator {
  measurements: Measurements;
  material: string;
  projectId?: string;
}
