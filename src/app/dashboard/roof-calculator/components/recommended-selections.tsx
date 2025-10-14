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
    { label: "Roof ridge", value: measurements.ridgeType === "ventilated" ? "Ventilated ridge cap" : measurements.ridgeType === "standard" ? "Standard ridge cap" : "Corrugated ridge cap" },
    { label: "Gutter", value: measurements.gutterSize === "cut-24" ? "Cut 24 (24 inches)" : "Cut 16 (16 inches)" },
    { label: "Screws", value: measurements.screwType.replaceAll("-", " ") },
    { label: "Insulation", value: `${(measurements.insulationType || "").replaceAll("-", " ")}${measurements.insulationThickness ? `, ${measurements.insulationThickness}` : ""}`.trim() },
    { label: "Ventilation", value: `${(measurements.ventilationType || "").replaceAll("-", " ")}${measurements.ventilationPieces ? ` × ${measurements.ventilationPieces}` : ""}`.trim() },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">Recommended Selections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">{item.label}</span>
              <Badge variant="secondary" className="text-xs w-fit">
                {item.value || "—"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


