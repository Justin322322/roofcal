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
import { Button } from "@/components/ui/button";
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

// Static materials data for fallback and component imports
export const materials: Material[] = [
  { value: 'corrugated-0.4', name: 'Corrugated (0.4mm)', price: 450, description: 'Lightweight, weather-resistant, 30-50 year lifespan - 0.4mm thickness' },
  { value: 'corrugated-0.5', name: 'Corrugated (0.5mm)', price: 520, description: 'Durable, weather-resistant, 30-50 year lifespan - 0.5mm thickness' },
  { value: 'longspan-0.4', name: 'Long Span (0.4mm)', price: 520, description: 'Durable, weather-resistant, excellent water drainage - 0.4mm thickness' },
  { value: 'longspan-0.5', name: 'Long Span (0.5mm)', price: 600, description: 'Durable, weather-resistant, excellent water drainage - 0.5mm thickness' },
];

export function MaterialSelection({
  material,
  onMaterialChange,
  onRidgeTypeChange,
  selectedWarehouseId,
}: MaterialSelectionProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load materials from API on mount or when warehouse changes
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
        setLoadError(null);
        
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
        console.error('Failed to load materials from API:', error);
        setMaterials([]);
        setLoadError('Failed to load materials. Please try again.');
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, [selectedWarehouseId]);

  const selectedMaterial = materials.find((m) => m.value === material);

  // Do not auto-select; require explicit user choice

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
        {loadError && (
          <div className="flex items-center justify-between gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
            <span className="text-sm">{loadError}</span>
            <Button size="sm" variant="outline" onClick={() => {
              // trigger reload by resetting selectedWarehouseId dependency path
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              (async () => {
                try {
                  setIsLoadingMaterials(true);
                  setLoadError(null);
                  // Re-run effect logic
                  const url = selectedWarehouseId
                    ? `/api/warehouses/${selectedWarehouseId}/materials`
                    : '/api/pricing?category=materials';
                  const response = await fetch(url);
                  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                  const result = await response.json();
                  if (result.success && result.data) {
                    if (selectedWarehouseId) {
                      const warehouseMaterials = result.data
                        .filter((wm: any) => wm.isActive && wm.quantity > 0)
                        .map((wm: any) => ({
                          value: wm.material.name,
                          name: wm.material.label,
                          price: wm.material.price * (1 + wm.locationAdjustment / 100),
                          description: wm.material.description || '',
                        }));
                      setMaterials(warehouseMaterials);
                    } else {
                      const dbMaterials = result.data.map((m: PricingConfigAPIResponse) => ({
                        value: m.name,
                        name: m.label,
                        price: m.price,
                        description: m.description || '',
                      }));
                      setMaterials(dbMaterials);
                    }
                  } else {
                    throw new Error('Invalid API response format');
                  }
                } catch (e) {
                  console.error(e);
                  setLoadError('Failed to load materials. Please try again.');
                } finally {
                  setIsLoadingMaterials(false);
                }
              })();
            }}>Retry</Button>
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

// No fallback re-exports
