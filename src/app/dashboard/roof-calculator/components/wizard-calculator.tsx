"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { ConstructionModeSelector } from "./construction-mode-selector";
import { BudgetValidator } from "./budget-validator";
import { MeasurementForm } from "./measurement-form";
import { ConsolidatedMaterialSelection } from "./consolidated-material-selection";
import { ConsolidatedAdditionalSpecs } from "./consolidated-additional-specs";
import { CalculationResults } from "./calculation-results";
import { RecommendedSelections } from "./recommended-selections";
import { DecisionInsights } from "./decision-insights";
import { ProjectActions } from "./project-actions";
import { getBudgetValidationResult } from "./budget-validator";
import type { Measurements, CalculationResults as CalcResults, DecisionTreeResult } from "../types";
import type { OptimizationResult } from "./optimization-results-dialog";

interface WizardCalculatorProps {
  measurements: Measurements;
  setMeasurements: (measurements: Measurements) => void;
  material: string;
  setMaterial: (material: string) => void;
  results: CalcResults;
  decisionTree: DecisionTreeResult;
  onReset: () => void;
  onAutoOptimize?: () => OptimizationResult;
  isPricingLoaded: boolean;
  isAdminMode?: boolean;
  isAdminSelfMode?: boolean;
  selectedClientId?: string;
  selectedClientName?: string;
  onProjectCreated?: () => void;
}

const STEPS = [
  { id: 1, title: "Project Setup", description: "Select project type and enter your budget" },
  { id: 2, title: "Measurements", description: "Enter your roof dimensions and specifications" },
  { id: 3, title: "Material & Hardware", description: "Choose your budget level, roofing material, and screw type" },
  { id: 4, title: "Additional Specs", description: "Thickness, ridge, gutter, insulation & ventilation" },
  { id: 5, title: "Calculation", description: "Review your complete cost breakdown" },
];

export function WizardCalculator({
  measurements,
  setMeasurements,
  material,
  setMaterial,
  results,
  decisionTree,
  onReset,
  onAutoOptimize,
  isPricingLoaded,
  isAdminMode = false,
  isAdminSelfMode = false,
  selectedClientId,
  onProjectCreated,
}: WizardCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [includeAdditionalSpecs, setIncludeAdditionalSpecs] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>();
  const [projectAddress, setProjectAddress] = useState<{ coordinates: { latitude: number; longitude: number } } | null>(null);

  const progress = (currentStep / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return parseFloat(measurements.budgetAmount) > 0;
      case 2:
        return (
          parseFloat(measurements.length) > 0 &&
          parseFloat(measurements.width) > 0 &&
          measurements.pitch &&
          measurements.roofType
        );
      case 3:
        return material && measurements.screwType && measurements.budgetLevel;
      case 4:
        return true; // Additional specs are optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProjectLoaded = (data: {
    measurements: Measurements;
    material: string;
    projectId?: string;
  }) => {
    setMeasurements(data.measurements);
    setMaterial(data.material);
    setCurrentProjectId(data.projectId);
  };

  const handleProjectSaved = () => {
    // Reset to step 1 after successful save
    setCurrentStep(1);
    // Reset project ID
    setCurrentProjectId(undefined);
    // Close save dialog
    setSaveDialogOpen(false);
  };

  const getMaterialName = (materialValue: string): string => {
    return materialValue || "";
  };

  // Labor cost is always included
  const displayLaborCost = results.laborCost;
  const displayTotalCost = results.totalCost;

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="mt-1">
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </div>
            {currentStep < STEPS.length && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>{currentStep - 1}/{STEPS.length - 1}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Project Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <ConstructionModeSelector
                mode={measurements.constructionMode}
                onModeChange={(mode) => {
                  setMeasurements({
                    ...measurements,
                    constructionMode: mode,
                  });
                }}
                onProjectLoaded={handleProjectLoaded}
              />

              {/* Labor Cost Info */}
              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-2">Labor Cost Included</h3>
                <p className="text-sm text-muted-foreground">
                  Labor cost is always included in your calculations. The rate is {measurements.constructionMode === "repair" ? "20%" : "40%"} of material costs for {measurements.constructionMode === "repair" ? "repair" : "new construction"} projects.
                </p>
              </div>

              <div className="border-t pt-6">
                <BudgetValidator
                  budgetAmount={measurements.budgetAmount}
                  onChange={(value) =>
                    setMeasurements({ ...measurements, budgetAmount: value })
                  }
                  roofArea={results.area}
                  selectedMaterial={material}
                  totalCost={displayTotalCost}
                />
              </div>
            </div>
          )}

          {/* Step 2: Measurements */}
          {currentStep === 2 && (
            <MeasurementForm
              measurements={measurements}
              onMeasurementsChange={(newMeasurements) =>
                setMeasurements(newMeasurements)
              }
            />
          )}

          {/* Step 3: Material & Hardware Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <ConsolidatedMaterialSelection
                material={material}
                onMaterialChange={(newMaterial) => {
                  setMaterial(newMaterial);

                  // Auto-correct roof type when switching to Long Span (corrugated)
                  if (newMaterial === "corrugated" &&
                    measurements.roofType !== "gable" &&
                    measurements.roofType !== "shed") {
                    setMeasurements({
                      ...measurements,
                      roofType: "gable"
                    });
                  }
                }}
                screwType={measurements.screwType}
                onScrewTypeChange={(screwType) =>
                  setMeasurements({ ...measurements, screwType })
                }
                budgetLevel={measurements.budgetLevel}
                onBudgetLevelChange={(budgetLevel, materialThickness) => {
                  setMeasurements({ ...measurements, budgetLevel, materialThickness });
                  setMaterial("");
                }}
              />

              {/* Recommended Selections */}
              {material && (
                <div className="mt-6">
                  <RecommendedSelections
                    measurements={measurements}
                    materialName={getMaterialName(material)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Additional Specifications */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Yes/No Option */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-3">Add Additional Specifications?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Additional specs include ridge type, gutter details, insulation, and ventilation. These are optional.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={includeAdditionalSpecs ? "default" : "outline"}
                    onClick={() => setIncludeAdditionalSpecs(true)}
                    className="h-auto py-3"
                  >
                    <div className="text-center w-full">
                      <div className="font-medium">Yes</div>
                      <div className="text-xs opacity-70 mt-1">
                        Customize specifications
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant={!includeAdditionalSpecs ? "default" : "outline"}
                    onClick={() => setIncludeAdditionalSpecs(false)}
                    className="h-auto py-3"
                  >
                    <div className="text-center w-full">
                      <div className="font-medium">No</div>
                      <div className="text-xs opacity-70 mt-1">
                        Use defaults
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Show specs if user selected Yes */}
              {includeAdditionalSpecs && (
                <div className="border-t pt-6">
                  <ConsolidatedAdditionalSpecs
                    measurements={measurements}
                    onMeasurementsChange={(updates) =>
                      setMeasurements({ ...measurements, ...updates })
                    }
                    roofArea={results.area}
                    calculatedGutterPieces={results.gutterPieces}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Calculation Results */}
          {currentStep === 5 && isPricingLoaded && material && (
            <div className="space-y-4">
              {/* Completion Status Indicator */}
              <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Calculation Complete!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Review your estimate below and save your project when ready.
                    </p>
                  </div>
                </div>
              </div>

              <CalculationResults
                area={results.area}
                materialCost={results.materialCost}
                gutterCost={results.gutterCost}
                ridgeCost={results.ridgeCost}
                screwsCost={results.screwsCost}
                insulationCost={results.insulationCost}
                ventilationCost={results.ventilationCost}
                totalMaterialsCost={results.totalMaterialsCost}
                laborCost={displayLaborCost}
                totalCost={displayTotalCost}
                gutterPieces={results.gutterPieces}
                ridgeLength={results.ridgeLength}
                materialQuantity={results.materialQuantity}
                screwsQuantity={results.screwsQuantity}
                material={getMaterialName(material)}
                screwType={measurements.screwType}
                constructionMode={measurements.constructionMode}
                budgetAmount={parseFloat(measurements.budgetAmount) || 0}
                onAutoOptimize={onAutoOptimize}
                onBudgetRedirect={() => setCurrentStep(1)}
                length={parseFloat(measurements.length) || undefined}
                width={parseFloat(measurements.width) || undefined}
                pitch={parseFloat(measurements.pitch) || undefined}
                roofTypeLabel={`${measurements.roofType.charAt(0).toUpperCase()}${measurements.roofType.slice(1)} roof${measurements.roofType === "shed" ? " (single slope)" : ""}`}
                materialThickness={measurements.materialThickness}
                ridgeType={measurements.ridgeType}
                gutterSize={measurements.gutterSize}
                gutterMaterial={measurements.gutterMaterial}
                insulationType={measurements.insulationType}
                insulationThickness={measurements.insulationThickness}
                ventilationType={measurements.ventilationType}
              />

              {/* Decision Insights */}
              {results.totalCost > 0 && (
                <DecisionInsights
                  decisionTree={decisionTree}
                  currentMaterial={material}
                  area={results.area}
                />
              )}

              {/* Quick Tips */}
              {results.totalCost > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">Quick Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs sm:text-sm">
                    <p>• Add 10% extra material for waste and cuts</p>
                    <p>• Consider additional costs for underlayment and flashing</p>
                    <p>• Labor costs may vary by region and complexity</p>
                    <p>• Steep roofs (over 6:12 pitch) may incur additional charges</p>
                  </CardContent>
                </Card>
              )}

              {/* Info Messages */}
              {!includeAdditionalSpecs && (
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
                  <p className="font-medium mb-1">Using Default Specifications</p>
                  <p className="text-muted-foreground">
                    Additional specifications (ridge type, gutter details, insulation, ventilation) are using default values. You can go back to Step 4 to customize them.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          variant="ghost"
          onClick={onReset}
          className="text-muted-foreground"
        >
          Reset All
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <ProjectActions
              measurements={measurements}
              results={results}
              decisionTree={decisionTree}
              material={material}
              currentProjectId={currentProjectId}
              saveDialogOpen={saveDialogOpen}
              onSaveDialogChange={setSaveDialogOpen}
              saveEnabled={true}
              selectedWarehouseId={selectedWarehouseId}
              onWarehouseChange={setSelectedWarehouseId}
              projectAddress={projectAddress}
              onAddressChange={setProjectAddress}
              onProjectCreated={onProjectCreated || handleProjectSaved}
              isBudgetSufficient={getBudgetValidationResult(measurements.budgetAmount, displayTotalCost).isBudgetSufficient}
              isAdminMode={isAdminMode}
              isAdminSelfMode={isAdminSelfMode}
              selectedClientId={selectedClientId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
