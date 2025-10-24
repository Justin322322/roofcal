"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SparklesIcon, Loader2Icon, HammerIcon, WrenchIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { formatNumberWithCommas } from "../utils/format";
import { getSlopeMultiplier, SCREW_TYPES } from "../constants";
import { OptimizationResultsDialog, type OptimizationResult } from "./optimization-results-dialog";

interface CalculationResultsProps {
  area: number;
  materialCost: number;
  gutterCost: number;
  ridgeCost: number;
  screwsCost: number;
  insulationCost: number;
  ventilationCost: number;
  totalMaterialsCost: number;
  laborCost: number;
  totalCost: number;
  gutterPieces: number;
  ridgeLength: number;
  materialQuantity: number;
  screwsQuantity: number;
  material: string;
  screwType?: string;
  constructionMode: "new" | "repair";
  budgetAmount?: number;
  onAutoOptimize?: () => OptimizationResult;
  // For area breakdown
  length?: number;
  width?: number;
  pitch?: number;
  roofTypeLabel?: string;
  // Material detail fields
  materialThickness?: string;
  ridgeType?: string;
  gutterSize?: string;
  gutterMaterial?: string;
  insulationType?: string;
  insulationThickness?: string;
  ventilationType?: string;
  onBudgetRedirect?: () => void;
}

export function CalculationResults({
  area,
  materialCost,
  gutterCost,
  ridgeCost,
  screwsCost,
  insulationCost,
  ventilationCost,
  totalMaterialsCost,
  laborCost,
  totalCost,
  gutterPieces,
  ridgeLength,
  materialQuantity,
  screwsQuantity,
  material,
  screwType,
  constructionMode,
  budgetAmount,
  onAutoOptimize,
  length,
  width,
  pitch,
  roofTypeLabel,
  materialThickness,
  ridgeType,
  gutterSize,
  gutterMaterial,
  insulationType,
  insulationThickness,
  ventilationType,
  onBudgetRedirect,
}: CalculationResultsProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // Compute area breakdown based on provided inputs
  const planArea =
    typeof length === "number" && typeof width === "number"
      ? length * width
      : undefined;
  const slopeMultiplier =
    typeof pitch === "number" ? getSlopeMultiplier(pitch) : undefined;

  const handleOptimizeClick = async () => {
    if (!onAutoOptimize) return;

    setIsOptimizing(true);

    // Small delay to show the animation
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = onAutoOptimize();
    setOptimizationResult(result);

    // Keep button in loading state briefly after optimization
    await new Promise((resolve) => setTimeout(resolve, 400));

    setIsOptimizing(false);

    // Show the detailed optimization dialog
    setOptimizationDialogOpen(true);
  };

  if (area === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calculation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Enter measurements to see calculation results
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">Calculation Results</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{material || "No material"}</Badge>
              {onAutoOptimize && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOptimizeClick}
                  disabled={isOptimizing}
                  className="h-7 px-2 sm:px-3 text-xs"
                  title="Optimize settings while maintaining quality"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Optimizing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Optimize</span>
                      <span className="sm:hidden">Opt</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Roof Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Roof Area</span>
            <span className="text-base font-medium">
              {area.toFixed(2)} sq.m
            </span>
          </div>
          {planArea && slopeMultiplier ? (
            <div className="rounded-md border bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200 px-3 sm:px-4 py-3 space-y-1">
              <div className="text-sm font-semibold">Area from dimensions</div>
              <div className="text-xs sm:text-sm">Base: {length} × {width} = {planArea.toFixed(1)} m²</div>
              {roofTypeLabel && (
                <div className="text-xs sm:text-sm">{roofTypeLabel}</div>
              )}
              {typeof pitch === "number" && (
                <div className="text-xs sm:text-sm">{pitch}° pitch (+{((slopeMultiplier - 1) * 100).toFixed(0)}% slope area)</div>
              )}
              <div className="text-xs sm:text-sm">Total multiplier: {slopeMultiplier.toFixed(2)}x</div>
            </div>
          ) : null}
          <Separator />
        </div>

        {/* Material Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {materialThickness ? `${materialThickness} ${material}` : material} ({materialQuantity.toFixed(2)} sq.m)
            </span>
            <span className="text-base font-medium">
              ₱{formatNumberWithCommas(materialCost)}
            </span>
          </div>
          <Separator />
        </div>

        {gutterCost > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {gutterMaterial ? `${gutterMaterial} Gutter` : "Gutter"}
                {gutterSize && ` (${gutterSize})`} ({gutterPieces} pcs)
              </span>
              <span className="text-base font-medium">
                ₱{formatNumberWithCommas(gutterCost)}
              </span>
            </div>
            <Separator />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {ridgeType ? `${ridgeType} Ridge` : "Ridge"} ({ridgeLength.toFixed(1)}m)
            </span>
            <span className="text-base font-medium">
              ₱{formatNumberWithCommas(ridgeCost)}
            </span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {screwType ? SCREW_TYPES[screwType as keyof typeof SCREW_TYPES]?.name || 'Screws' : 'Screws'} ({screwsQuantity} pcs)
            </span>
            <span className="text-base font-medium">
              ₱{formatNumberWithCommas(screwsCost)}
            </span>
          </div>
          <Separator />
        </div>

        {insulationCost > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {insulationType ? `${insulationType} Insulation` : "Insulation"}
                {insulationThickness && ` (${insulationThickness})`}
              </span>
              <span className="text-base font-medium">
                ₱{formatNumberWithCommas(insulationCost)}
              </span>
            </div>
            <Separator />
          </div>
        )}

        {ventilationCost > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {ventilationType ? `${ventilationType} Ventilation` : "Ventilation"}
              </span>
              <span className="text-base font-medium">
                ₱{formatNumberWithCommas(ventilationCost)}
              </span>
            </div>
            <Separator />
          </div>
        )}

        {/* Total Materials */}
        <div className="space-y-2 bg-muted/50 -mx-6 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Materials</span>
            <span className="text-base font-semibold">
              ₱{formatNumberWithCommas(totalMaterialsCost)}
            </span>
          </div>
        </div>

        {/* Labor Cost */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              {constructionMode === "repair" ? (
                <WrenchIcon className="h-4 w-4" />
              ) : (
                <HammerIcon className="h-4 w-4" />
              )}
              Labor Cost ({constructionMode === "repair" ? "20%" : "40%"})
            </span>
            <span className="text-base font-medium">
              ₱{formatNumberWithCommas(laborCost)}
            </span>
          </div>
          <Separator />
        </div>

        {/* Removal cost no longer displayed */}

        {/* Total Cost */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-1">
            <span className="text-sm sm:text-base font-semibold">
              Total Estimated Cost
            </span>
            <span className="text-xl sm:text-2xl font-bold text-primary">
              ₱{formatNumberWithCommas(totalCost)}
            </span>
          </div>
        </div>

        {/* Budget Analysis */}
        {budgetAmount && budgetAmount > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Budget</span>
              <span className="text-base font-medium">
                ₱{formatNumberWithCommas(budgetAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {budgetAmount >= totalCost ? "Remaining" : "Additional Needed"}
              </span>
              <span
                className={`text-base font-semibold ${
                  budgetAmount >= totalCost ? "text-green-600" : "text-red-600"
                }`}
              >
                ₱{formatNumberWithCommas(Math.abs(budgetAmount - totalCost))}
              </span>
            </div>
            {budgetAmount >= totalCost && (
              <div className="text-xs text-green-600 text-center">
                Budget is sufficient with contingency funds
              </div>
            )}
            {budgetAmount < totalCost && (
              <Alert variant="destructive" className="mt-3">
                <XCircleIcon className="h-4 w-4" />
                <AlertTitle>Project Cannot Be Saved</AlertTitle>
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <strong>Budget falls short of estimated cost</strong>
                    </div>
                    <div>
                      Your budget of ₱{formatNumberWithCommas(budgetAmount)} is insufficient for this project.
                      <br />
                      <strong>Shortfall:</strong> ₱{formatNumberWithCommas(totalCost - budgetAmount)}
                    </div>
                    <div>
                      <strong>Required actions:</strong>
                      <br />• Increase your budget by at least ₱{formatNumberWithCommas(totalCost - budgetAmount)}
                      <br />• Or reduce project specifications to lower costs
                    </div>
                    {onBudgetRedirect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onBudgetRedirect}
                        className="w-full sm:w-auto mt-2"
                      >
                        Adjust Budget
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="pt-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1">
          <span>* {constructionMode === "repair" ? (
            <>
              <WrenchIcon className="h-3 w-3 inline mr-1" />
              <span>Repair</span>
            </>
          ) : (
            <>
              <HammerIcon className="h-3 w-3 inline mr-1" />
              <span>New construction</span>
            </>
          )}</span>
          <span className="hidden sm:inline">{" "}</span>
          <span>estimate includes all materials and labor. Additional fees may apply for permits and site-specific requirements.</span>
        </div>
      </CardContent>
      </Card>
      
      {/* Optimization Results Dialog */}
      <OptimizationResultsDialog
        open={optimizationDialogOpen}
        onOpenChange={setOptimizationDialogOpen}
        optimizationResult={optimizationResult}
      />
    </>
  );
}
