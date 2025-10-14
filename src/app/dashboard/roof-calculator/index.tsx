"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MeasurementForm } from "./components/measurement-form";
import { CalculationResults } from "./components/calculation-results";
import { RoofStatsCards } from "./components/stats-cards";
import { DecisionInsights } from "./components/decision-insights";
import { ConstructionModeSelector } from "./components/construction-mode-selector";
import { ConsolidatedAdditionalSpecs } from "./components/consolidated-additional-specs";
import { BudgetValidator } from "./components/budget-validator";
import { ProjectActions } from "./components/project-actions";
import { ConsolidatedMaterialSelection } from "./components/consolidated-material-selection";
import {
  CalculatorIcon,
  RotateCcwIcon,
  SettingsIcon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react";
import { useRoofCalculator } from "./hooks";
import { materials } from "./components/material-selection";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { Measurements } from "./types";
import { RecommendedSelections } from "./components/recommended-selections";

// Helper function to get material name with fallback
function getMaterialName(materialValue: string): string {
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.name || materialValue;
}

export function RoofCalculatorContent() {
  const {
    measurements,
    setMeasurements,
    material,
    setMaterial,
    results,
    decisionTree,
    handleReset,
    handleAutoOptimize,
  } = useRoofCalculator();

  const [isAdditionalSpecsOpen, setIsAdditionalSpecsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<
    string | undefined
  >();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveEnabled, setSaveEnabled] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>();
  const [projectAddress, setProjectAddress] = useState<{ coordinates: { latitude: number; longitude: number } } | null>(null);
  const additionalSpecsRef = useRef<HTMLDivElement>(null);

  // Scroll to the end of Additional Specifications when expanded
  useEffect(() => {
    if (isAdditionalSpecsOpen && additionalSpecsRef.current) {
      // Use a longer delay to ensure the collapsible animation completes
      const timer = setTimeout(() => {
        const element = additionalSpecsRef.current;
        if (element) {
          // Get the element's bottom position
          const rect = element.getBoundingClientRect();
          const elementBottom = rect.bottom + window.scrollY;

          // Calculate the position to scroll to (end of element + some padding)
          const scrollTo = elementBottom + 50; // 50px padding

          // Smooth scroll to the calculated position
          window.scrollTo({
            top: scrollTo,
            behavior: "smooth",
          });
        }
      }, 300); // Increased delay to match collapsible animation

      return () => clearTimeout(timer);
    }
  }, [isAdditionalSpecsOpen]);

  // Handle project loaded from ProjectActions
  const handleProjectLoaded = (data: {
    measurements: Measurements;
    material: string;
    projectId?: string;
  }) => {
    // Set measurements including construction mode from loaded project
    setMeasurements(data.measurements);
    setMaterial(data.material);
    setCurrentProjectId(data.projectId);
    setSaveEnabled(false); // Reset save enabled when project is loaded

    toast.success("Project loaded successfully", {
      description: "Project data has been loaded into the calculator",
    });
  };

  // Handle enabling save for repair project from ConstructionModeSelector
  const handleSaveRepairProject = () => {
    setSaveEnabled(true);
    toast.success("Save Project enabled", {
      description: "You can now save your calculations as a repair project",
    });
  };

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Action Buttons */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ProjectActions
                measurements={measurements}
                results={results}
                decisionTree={decisionTree}
                material={material}
                currentProjectId={currentProjectId}
                saveDialogOpen={saveDialogOpen}
                onSaveDialogChange={setSaveDialogOpen}
                saveEnabled={saveEnabled}
                selectedWarehouseId={selectedWarehouseId}
                onWarehouseChange={setSelectedWarehouseId}
                projectAddress={projectAddress}
                onAddressChange={setProjectAddress}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    // Add a small delay to show the loading state
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    handleReset();
                    setCurrentProjectId(undefined); // Clear current project on reset
                    setSaveEnabled(false); // Reset save enabled state
                    toast.success("Calculator reset successfully", {
                      description:
                        "All measurements and selections have been cleared",
                      duration: 3000,
                    });
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="flex-1 sm:flex-initial"
              >
                {isResetting ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcwIcon className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">{isResetting ? "Resetting..." : "Reset"}</span>
                <span className="sm:hidden">{isResetting ? "..." : "Reset"}</span>
              </Button>
            </div>
          </div>

      {/* Stats Cards */}
      <div className="mb-6 sm:mb-8">
        <RoofStatsCards
          area={results.area}
          complexity={decisionTree.complexity}
          totalCost={results.totalCost}
          material={material}
        />
      </div>

      {/* Main Content Grid */}
      <div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-4 sm:space-y-6">
            {/* Construction Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Construction Mode</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Select project type for accurate labor calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConstructionModeSelector
                  mode={measurements.constructionMode}
                  onModeChange={(mode) => {
                    setMeasurements({
                      ...measurements,
                      constructionMode: mode,
                    });
                    // Reset save enabled when switching modes
                    setSaveEnabled(false);
                  }}
                  onProjectLoaded={handleProjectLoaded}
                  currentProjectId={currentProjectId}
                  onSaveRepairProject={handleSaveRepairProject}
                />
              </CardContent>
            </Card>

            {/* Budget Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Budget Planning</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter your budget for validation and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetValidator
                  budgetAmount={measurements.budgetAmount}
                  onChange={(value) =>
                    setMeasurements({ ...measurements, budgetAmount: value })
                  }
                  roofArea={results.area}
                  selectedMaterial={material}
                  totalCost={results.totalCost}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CalculatorIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Measurements
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter your roof dimensions and specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeasurementForm
                  measurements={measurements}
                  onMeasurementsChange={(newMeasurements) => setMeasurements(newMeasurements)}
                />
              </CardContent>
            </Card>

            {/* Consolidated Material & Screw Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Material & Hardware Selection</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Choose your budget level, roofing material, and screw type
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  }}
                  selectedWarehouseId={selectedWarehouseId}
                />

                {/* Recommended Selections */}
                <div className="mt-4 sm:mt-6">
                  <RecommendedSelections
                    measurements={measurements}
                    materialName={getMaterialName(material)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <Collapsible
                open={isAdditionalSpecsOpen}
                onOpenChange={setIsAdditionalSpecsOpen}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                      <div className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Additional Specifications</span>
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          isAdditionalSpecsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Thickness, ridge, gutter, insulation & ventilation specifications
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div ref={additionalSpecsRef}>
                      <ConsolidatedAdditionalSpecs
                        measurements={measurements}
                        onMeasurementsChange={(updates) =>
                          setMeasurements({ ...measurements, ...updates })
                        }
                        roofArea={results.area}
                        calculatedGutterPieces={results.gutterPieces}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Right Column - Results & Analysis (Sticky) */}
          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-4 lg:self-start">
            <CalculationResults
              area={results.area}
              materialCost={results.materialCost}
              gutterCost={results.gutterCost}
              ridgeCost={results.ridgeCost}
              screwsCost={results.screwsCost}
              insulationCost={results.insulationCost}
              ventilationCost={results.ventilationCost}
              totalMaterialsCost={results.totalMaterialsCost}
              laborCost={results.laborCost}
              removalCost={results.removalCost}
              totalCost={results.totalCost}
              gutterPieces={results.gutterPieces}
              ridgeLength={results.ridgeLength}
              materialQuantity={results.materialQuantity}
              screwsQuantity={results.screwsQuantity}
              material={getMaterialName(material)}
              screwType={measurements.screwType}
              constructionMode={measurements.constructionMode}
              budgetAmount={parseFloat(measurements.budgetAmount) || 0}
              onAutoOptimize={handleAutoOptimize}
              length={parseFloat(measurements.length) || undefined}
              width={parseFloat(measurements.width) || undefined}
              pitch={parseFloat(measurements.pitch) || undefined}
              roofTypeLabel={`${measurements.roofType.charAt(0).toUpperCase()}${measurements.roofType.slice(1)} roof${measurements.roofType === "shed" ? " (single slope)" : ""}`}
            />

            {results.totalCost > 0 && (
              <DecisionInsights
                decisionTree={decisionTree}
                currentMaterial={material}
                area={results.area}
              />
            )}

            {results.totalCost > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                  <p>• Add 10% extra material for waste and cuts</p>
                  <p>
                    • Consider additional costs for underlayment and flashing
                  </p>
                  <p>• Labor costs may vary by region and complexity</p>
                  <p>
                    • Steep roofs (over 6:12 pitch) may incur additional charges
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
