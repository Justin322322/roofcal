"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  RulerIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  PackageIcon,
} from "lucide-react";
import type { ComplexityScore } from "@/lib/decision-tree";
import {
  formatCurrency,
  getComplexityLabel,
  getComplexityBadgeVariant,
} from "../utils";
import { materials } from "./material-selection";

interface RoofStatsCardsProps {
  area: number;
  complexity: ComplexityScore | null;
  totalCost: number;
  material: string;
  loading?: boolean;
}

// Helper function to get material name with fallback for thickness variants
function getMaterialName(materialValue: string): string {
  // Handle corrugated thickness variants
  if (materialValue === "corrugated-0.4") return "Long Span (0.4mm)";
  if (materialValue === "corrugated-0.5") return "Long Span (0.5mm)";
  
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.name || materialValue;
}

// Helper function to get material price
function getMaterialPrice(materialValue: string): number {
  // Handle corrugated thickness variants
  if (materialValue === "corrugated-0.4") return 650;
  if (materialValue === "corrugated-0.5") return 800;
  
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.price || 0;
}

export function RoofStatsCards({
  area,
  complexity,
  totalCost,
  material,
  loading = false,
}: RoofStatsCardsProps) {
  const stats = useMemo(() => {
    const materialName = getMaterialName(material);
    const materialPrice = getMaterialPrice(material);

    return [
      {
        title: "Roof Area",
        value: area > 0 ? `${area.toFixed(2)} sq.m` : "—",
        icon: RulerIcon,
        description: "Total calculated area",
      },
      {
        title: "Complexity",
        value: complexity ? (
          <Badge variant={getComplexityBadgeVariant(complexity.level)}>
            {complexity.score}/10
          </Badge>
        ) : (
          "—"
        ),
        icon: AlertTriangleIcon,
        description: complexity
          ? getComplexityLabel(complexity.level)
          : "No data",
      },
      {
        title: "Total Cost",
        value: totalCost > 0 ? formatCurrency(totalCost) : "—",
        icon: DollarSignIcon,
        description: totalCost > 0 ? "Material + Labor" : "Enter measurements",
      },
      {
        title: "Material",
        value: materialName,
        icon: PackageIcon,
        description: materialPrice > 0
          ? `${formatCurrency(materialPrice)}/sq.m`
          : "Select material",
      },
    ];
  }, [area, complexity, totalCost, material]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof stat.value === "string" ? stat.value : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
