"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { formatNumberWithCommas } from "../utils/format";
import { getSlopeMultiplier, SCREW_TYPES } from "../constants";
import { toast } from "sonner";

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
  onAutoOptimize?: () => { hasChanges: boolean; changesCount: number };
  // For area breakdown
  length?: number;
  width?: number;
  pitch?: number;
  roofTypeLabel?: string;
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
}: CalculationResultsProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

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

    const optimizationResult = onAutoOptimize();

    // Keep button in loading state briefly after optimization
    await new Promise((resolve) => setTimeout(resolve, 400));

    setIsOptimizing(false);

    // Show appropriate toast based on optimization results
    if (optimizationResult.hasChanges) {
      toast.success("Optimization completed", {
        description: `${optimizationResult.changesCount} setting${optimizationResult.changesCount > 1 ? "s" : ""} optimized for better performance and cost efficiency`,
        duration: 4000,
      });
    } else {
      toast.info("Already optimized", {
        description:
          "Your current settings are already optimized for the best performance and cost efficiency",
        duration: 4000,
      });
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Calculation Results</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{material || "No material"}</Badge>
            {onAutoOptimize && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOptimizeClick}
                disabled={isOptimizing}
                className="h-7 px-3 text-xs"
                title="Optimize settings while maintaining quality"
              >
                {isOptimizing ? (
                  <>
                    <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    Optimize
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
            <div className="rounded-md border bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200 px-4 py-3 space-y-1">
              <div className="text-sm font-semibold">Area from dimensions</div>
              <div className="text-sm">Base: {length} × {width} = {planArea.toFixed(1)} m²</div>
              {roofTypeLabel && (
                <div className="text-sm">{roofTypeLabel}</div>
              )}
              {typeof pitch === "number" && (
                <div className="text-sm">{pitch}° pitch (+{((slopeMultiplier - 1) * 100).toFixed(0)}% slope area)</div>
              )}
              <div className="text-sm">Total multiplier: {slopeMultiplier.toFixed(2)}x</div>
            </div>
          ) : null}
          <Separator />
        </div>

        {/* Material Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {material} ({materialQuantity.toFixed(2)} sq.m)
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
                Gutter ({gutterPieces} pcs)
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
              Ridge ({ridgeLength.toFixed(1)}m)
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
              <span className="text-sm text-muted-foreground">Insulation</span>
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
              <span className="text-sm text-muted-foreground">Ventilation</span>
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
            <span className="text-sm text-muted-foreground">
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
          <div className="flex items-center justify-between pt-2">
            <span className="text-base font-semibold">
              Total Estimated Cost
            </span>
            <span className="text-2xl font-bold text-primary">
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
              <div className="text-xs text-red-600 text-center">
                Budget falls short of estimated cost
              </div>
            )}
          </div>
        )}

        <div className="pt-4 text-xs text-muted-foreground">
          * {constructionMode === "repair" ? "Repair" : "New construction"}{" "}
          estimate includes all materials and labor. Additional fees may apply for permits and site-specific requirements.
        </div>
      </CardContent>
    </Card>
  );
}
