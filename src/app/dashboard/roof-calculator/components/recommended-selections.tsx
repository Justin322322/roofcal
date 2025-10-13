"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Measurements } from "../types";

interface RecommendedSelectionsProps {
  measurements: Measurements;
  materialName: string;
}

export function RecommendedSelections({ measurements, materialName }: RecommendedSelectionsProps) {
  const items: { label: string; value: string }[] = [
    { label: "Roof material", value: materialName },
    { label: "Roof ridge", value: measurements.ridgeType === "ventilated" ? "Ventilated ridge cap" : measurements.ridgeType === "standard" ? "Standard ridge cap" : "Long Span ridge cap" },
    { label: "Gutter", value: measurements.gutterSize === "large" ? "Large (6 inch)" : "Standard (5 inch)" },
    { label: "Screws", value: measurements.screwType.replaceAll("-", " ") },
    { label: "Insulation", value: `${(measurements.insulationType || "").replaceAll("-", " ")}${measurements.insulationThickness ? `, ${measurements.insulationThickness}` : ""}`.trim() },
    { label: "Ventilation", value: `${(measurements.ventilationType || "").replaceAll("-", " ")}${measurements.ventilationPieces ? ` × ${measurements.ventilationPieces}` : ""}`.trim() },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Selections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <Badge variant="secondary" className="text-xs">
                {item.value || "—"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


