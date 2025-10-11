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

export function RoofStatsCards({
  area,
  complexity,
  totalCost,
  material,
  loading = false,
}: RoofStatsCardsProps) {
  const stats = useMemo(() => {
    const selectedMaterial = materials.find((m) => m.value === material);
    const materialName = selectedMaterial?.name || "Not Selected";

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
        description: selectedMaterial
          ? `${formatCurrency(selectedMaterial.price)}/sq.m`
          : "Select material",
      },
    ];
  }, [area, complexity, totalCost, material]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
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
