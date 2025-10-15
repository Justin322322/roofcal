"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// Remove direct import of server-side function

interface MaterialSelectionProps {
  material: string;
  onMaterialChange: (material: string) => void;
  onRidgeTypeChange?: (ridgeType: string) => void;
  selectedWarehouseId?: string;
}

interface Material {
  value: string;
  name: string;
  price: number;
  description: string;
}

interface PricingConfigAPIResponse {
  id: string;
  category: string;
  name: string;
  label: string;
  description: string | null;
  price: number;
  unit: string;
  isActive: boolean;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

// Fallback materials for when database is unavailable
const fallbackMaterials: Material[] = [
  {
    value: "corrugated-0.4",
    name: "Corrugated (0.4mm)",
    price: 450,
    description: "Lightweight, weather-resistant, 30-50 year lifespan - 0.4mm thickness",
  },
  {
    value: "corrugated-0.5",
    name: "Corrugated (0.5mm)",
    price: 520,
    description: "Durable, weather-resistant, 30-50 year lifespan - 0.5mm thickness",
  },
  {
    value: "longspan-0.4",
    name: "Long Span (0.4mm)",
    price: 520,
    description: "Durable, weather-resistant, excellent water drainage - 0.4mm thickness",
  },
  {
    value: "longspan-0.5",
    name: "Long Span (0.5mm)",
    price: 600,
    description: "Durable, weather-resistant, excellent water drainage - 0.5mm thickness",
  },
];

export function MaterialSelection({
  material,
  onMaterialChange,
  onRidgeTypeChange,
  selectedWarehouseId,
}: MaterialSelectionProps) {
  const [materials, setMaterials] = useState<Material[]>(fallbackMaterials);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  // Load materials from API on mount or when warehouse changes
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
        
        if (selectedWarehouseId) {
          // Load materials from specific warehouse
          const response = await fetch(`/api/warehouses/${selectedWarehouseId}/materials`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            // Filter to only show materials that are active and in stock
            interface WarehouseMaterial {
              isActive: boolean;
              quantity: number;
              locationAdjustment: number;
              material: {
                name: string;
                label: string;
                price: number;
                description: string | null;
              };
            }

            const warehouseMaterials = result.data
              .filter((wm: WarehouseMaterial) => wm.isActive && wm.quantity > 0)
              .map((wm: WarehouseMaterial) => ({
                value: wm.material.name,
                name: wm.material.label,
                price: wm.material.price * (1 + wm.locationAdjustment / 100),
                description: wm.material.description || '',
              }));
            // Show all available materials from warehouse
            setMaterials(warehouseMaterials);
          } else {
            throw new Error('Invalid API response format');
          }
        } else {
          // Load all materials from pricing config (default behavior)
          const response = await fetch('/api/pricing?category=materials');
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            // Transform API data to match expected format
            const dbMaterials = result.data.map((material: PricingConfigAPIResponse) => ({
              value: material.name,
              name: material.label,
              price: material.price,
              description: material.description || '',
            }));
            // Show all available materials from database
            setMaterials(dbMaterials);
          } else {
            throw new Error('Invalid API response format');
          }
        }
      } catch (error) {
        console.error('Failed to load materials from API, using fallback:', error);
        // Use all fallback materials
        setMaterials(fallbackMaterials);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, [selectedWarehouseId]);

  const selectedMaterial = materials.find((m) => m.value === material);

  // Ensure currently selected material is valid; default to first available material
  useEffect(() => {
    if (!isLoadingMaterials) {
      const exists = materials.some((m) => m.value === material);
      if (!exists && materials.length > 0) {
        onMaterialChange(materials[0].value);
        if (materials[0].value === "corrugated" && onRidgeTypeChange) {
          onRidgeTypeChange("corrugated");
        }
      }
    }
  }, [isLoadingMaterials, materials, material, onMaterialChange, onRidgeTypeChange]);

  const handleMaterialChange = (newMaterial: string) => {
    onMaterialChange(newMaterial);
    
    // Auto-sync ridge material when corrugated is selected
    if (newMaterial === "corrugated" && onRidgeTypeChange) {
      onRidgeTypeChange("corrugated");
    }
  };

  if (isLoadingMaterials) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="material">Roofing Material</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="space-y-2">
        <Label htmlFor="material">Roofing Material</Label>
        {selectedWarehouseId && (
          <div className="text-sm text-muted-foreground">
            Showing {materials.length} materials from selected warehouse
          </div>
        )}
        <Select value={material} onValueChange={handleMaterialChange}>
          <SelectTrigger className="max-w-full truncate">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((mat) => (
              <SelectItem key={mat.value} value={mat.value}>
                {mat.name} - ₱{mat.price.toLocaleString()}/sq.m
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMaterial && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedMaterial.name}</CardTitle>
            <CardDescription>{selectedMaterial.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Price per sq.m
              </span>
              <span className="text-lg font-semibold">
                ₱{selectedMaterial.price.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export fallback materials for backwards compatibility
export { fallbackMaterials as materials };
