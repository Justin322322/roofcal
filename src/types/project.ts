/**
 * Project-related TypeScript interfaces and types
 */

import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "@/app/dashboard/roof-calculator/types";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "CLIENT_PENDING" | "CONTRACTOR_REVIEWING" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "REJECTED";
export type ConstructionMode = "NEW" | "REPAIR";
export type ProposalStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "REVISED";

export interface Project {
  id: string;
  userId: string;
  projectName: string;
  clientName?: string | null;
  status: ProjectStatus;
  
  // Contractor-Client relationship fields
  contractorId?: string | null;
  clientId?: string | null;
  assignedAt?: Date | null;
  proposalSent?: Date | null;
  proposalStatus?: ProposalStatus | null;

  // Delivery and Location
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryCost?: number | null;
  deliveryDistance?: number | null;
  warehouseId?: string | null;

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
  recommendedMaterial?: string | null;
  optimizationTips?: string | null;

  // Metadata
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  projectName: string;
  clientName?: string | null;
  status?: ProjectStatus;
  
  // Contractor-Client relationship fields
  contractorId?: string | null;
  clientId?: string | null;
  assignedAt?: Date | null;
  proposalSent?: Date | null;
  proposalStatus?: ProposalStatus | null;

  // Delivery and Location
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryCost?: number | null;
  deliveryDistance?: number | null;
  warehouseId?: string | null;

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
  recommendedMaterial?: string | null;
  optimizationTips?: string | null;

  // Metadata
  notes?: string | null;
}

export interface UpdateProjectInput {
  projectName?: string;
  clientName?: string | null;
  status?: ProjectStatus;
  
  // Contractor-Client relationship fields
  contractorId?: string | null;
  clientId?: string | null;
  assignedAt?: Date | null;
  proposalSent?: Date | null;
  proposalStatus?: ProposalStatus | null;

  // Delivery and Location
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryCost?: number | null;
  deliveryDistance?: number | null;
  warehouseId?: string | null;

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
  recommendedMaterial?: string | null;
  optimizationTips?: string | null;

  notes?: string | null;
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
  clientName?: string | null;
  notes?: string | null;
  // Delivery address fields
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  warehouseId: string;
  deliveryCost?: number;
  deliveryDistance?: number;
}

// Helper type for converting project data back to calculator format
export interface ProjectToCalculator {
  measurements: Measurements;
  material: string;
  projectId?: string;
}

// New interfaces for contractor-homeowner workflow
export interface ContractorInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
  location?: string;
  rating?: number;
  completedProjects?: number;
}

export interface ProjectAssignment {
  projectId: string;
  contractorId: string;
  clientId: string;
  assignedAt: Date;
  status: ProjectStatus;
}

export interface ProposalData {
  projectId: string;
  contractorId: string;
  clientId: string;
  proposalText?: string;
  proposalStatus: ProposalStatus;
  sentAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  customPricing?: {
    materialCost?: number;
    laborCost?: number;
    additionalFees?: number;
    totalCost?: number;
  };
}
