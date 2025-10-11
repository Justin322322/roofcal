"use client";

import { Badge } from "@/components/ui/badge";
import type { ComplexityScore } from "@/lib/decision-tree";
import { getComplexityProgressColor } from "../utils";

interface ComplexityMeterProps {
  complexity: ComplexityScore;
}

export function ComplexityMeter({ complexity }: ComplexityMeterProps) {
  const { score, factors } = complexity;
  const percentage = (score / 10) * 100;
  const colorClass = getComplexityProgressColor(score);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Complexity Score</span>
        <span className="text-sm font-bold">{score}/10</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 w-full overflow-hidden bg-secondary">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Factors */}
      {factors.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {factors.map((factor, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {factor}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Score based on pitch, roof type, area, material, building height,
        thickness, ridge & gutter specs
      </p>
    </div>
  );
}
