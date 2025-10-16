"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RulerIcon,
  DollarSignIcon,
  PackageIcon,
} from "lucide-react";
import {
  formatCurrency,
} from "../utils";
import { materials } from "./material-selection";

interface RoofStatsCardsProps {
  area: number;
  totalCost: number;
  material: string;
  loading?: boolean;
}

// Helper function to get material name with fallback for thickness variants
function getMaterialName(materialValue: string): string {
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.name || materialValue;
}

// Helper function to get material price
function getMaterialPrice(materialValue: string): number {
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.price || 0;
}

export function RoofStatsCards({
  area,
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
  }, [area, totalCost, material]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 sm:h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {typeof stat.value === "string" ? stat.value : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
