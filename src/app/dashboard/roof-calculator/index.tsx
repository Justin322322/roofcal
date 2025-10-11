"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MeasurementForm } from "./components/measurement-form";
import { MaterialSelection } from "./components/material-selection";
import { CalculationResults } from "./components/calculation-results";
import { RoofStatsCards } from "./components/stats-cards";
import { DecisionInsights } from "./components/decision-insights";
import { AdditionalSpecs } from "./components/additional-specs";
import { ConstructionModeSelector } from "./components/construction-mode-selector";
import { GutterCalculator } from "./components/gutter-calculator";
import { InsulationVentilation } from "./components/insulation-ventilation";
import { BudgetValidator } from "./components/budget-validator";
import {
  CalculatorIcon,
  RotateCcwIcon,
  SettingsIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useRoofCalculator } from "./hooks";
import { materials } from "./components/material-selection";
import { useState, useRef, useEffect } from "react";

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
  const additionalSpecsRef = useRef<HTMLDivElement>(null);

  // Auto-expand Additional Specifications when user first changes budget, thickness, ridge, or gutter
  useEffect(() => {
    // Check if user has made any non-default selections
    const hasCustomSpecs =
      measurements.budgetLevel !== "medium" ||
      measurements.materialThickness !== "standard" ||
      measurements.ridgeType !== "standard" ||
      measurements.gutterSize !== "standard";

    // Only auto-expand if user has custom specs and section is not already open
    // This prevents forcing it open after user manually closes it
    if (hasCustomSpecs && !isAdditionalSpecsOpen) {
      setIsAdditionalSpecsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    measurements.budgetLevel,
    measurements.materialThickness,
    measurements.ridgeType,
    measurements.gutterSize,
  ]);

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

  return (
    <>
      {/* Header with description and reset button */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          Calculate roofing materials and costs with intelligent recommendations
        </p>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcwIcon className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6">
        <RoofStatsCards
          area={results.area}
          complexity={decisionTree.complexity}
          totalCost={results.totalCost}
          material={material}
        />
      </div>

      {/* Main Content Grid */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Inputs (Sticky) */}
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            {/* Construction Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Construction Mode</CardTitle>
                <CardDescription>
                  Select project type for accurate labor calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConstructionModeSelector
                  mode={measurements.constructionMode}
                  onModeChange={(mode) =>
                    setMeasurements({ ...measurements, constructionMode: mode })
                  }
                />
              </CardContent>
            </Card>

            {/* Budget Validation */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Planning</CardTitle>
                <CardDescription>
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
                <CardTitle className="flex items-center gap-2">
                  <CalculatorIcon className="h-5 w-5" />
                  Measurements
                </CardTitle>
                <CardDescription>
                  Enter your roof dimensions and specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeasurementForm
                  measurements={measurements}
                  onMeasurementsChange={setMeasurements}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Selection</CardTitle>
                <CardDescription>
                  Choose your preferred roofing material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialSelection
                  material={material}
                  onMaterialChange={setMaterial}
                />
              </CardContent>
            </Card>

            <Card>
              <Collapsible
                open={isAdditionalSpecsOpen}
                onOpenChange={setIsAdditionalSpecsOpen}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Additional Specifications
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          isAdditionalSpecsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Budget, thickness, ridge & gutter specifications
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div ref={additionalSpecsRef} className="space-y-6">
                      <AdditionalSpecs
                        measurements={measurements}
                        onMeasurementsChange={(updates) =>
                          setMeasurements({ ...measurements, ...updates })
                        }
                      />

                      <Separator />

                      {/* Gutter Calculator */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">
                          Gutter Specifications
                        </h4>
                        <GutterCalculator
                          gutterLengthA={measurements.gutterLengthA}
                          gutterSlope={measurements.gutterSlope}
                          gutterLengthC={measurements.gutterLengthC}
                          gutterSize={measurements.gutterSize}
                          onGutterChange={(field, value) =>
                            setMeasurements({ ...measurements, [field]: value })
                          }
                          calculatedPieces={results.gutterPieces}
                        />
                      </div>

                      <Separator />

                      {/* Insulation & Ventilation */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">
                          Insulation & Ventilation
                        </h4>
                        <InsulationVentilation
                          insulationThickness={measurements.insulationThickness}
                          ventilationPieces={measurements.ventilationPieces}
                          onChange={(field, value) =>
                            setMeasurements({ ...measurements, [field]: value })
                          }
                          roofArea={results.area}
                        />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Right Column - Results & Analysis */}
          <div className="space-y-6">
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
              material={materials.find((m) => m.value === material)?.name || ""}
              constructionMode={measurements.constructionMode}
              budgetAmount={parseFloat(measurements.budgetAmount) || 0}
              onAutoOptimize={handleAutoOptimize}
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
                  <CardTitle className="text-base">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
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
    </>
  );
}
