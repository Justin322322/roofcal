"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

interface CalculationResultsProps {
  area: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  material: string;
  onAutoOptimize?: () => void;
}

export function CalculationResults({
  area,
  materialCost,
  laborCost,
  totalCost,
  material,
  onAutoOptimize,
}: CalculationResultsProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimizeClick = async () => {
    if (!onAutoOptimize) return;

    setIsOptimizing(true);

    // Small delay to show the animation
    await new Promise((resolve) => setTimeout(resolve, 600));

    onAutoOptimize();

    // Keep button in loading state briefly after optimization
    await new Promise((resolve) => setTimeout(resolve, 400));

    setIsOptimizing(false);
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
                title="Optimize settings to reduce complexity while maintaining quality"
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Roof Area</span>
            <span className="text-base font-medium">
              {area.toFixed(2)} sq.m
            </span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Material Cost</span>
            <span className="text-base font-medium">
              ₱{materialCost.toLocaleString()}
            </span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Labor Cost (30%)
            </span>
            <span className="text-base font-medium">
              ₱{laborCost.toLocaleString()}
            </span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between pt-2">
            <span className="text-base font-semibold">
              Total Estimated Cost
            </span>
            <span className="text-2xl font-bold text-primary">
              ₱{totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="pt-4 text-xs text-muted-foreground">
          * Estimates include material and labor costs. Additional fees may
          apply for permits, waste removal, and complex installations.
        </div>
      </CardContent>
    </Card>
  );
}
