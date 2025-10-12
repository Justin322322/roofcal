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
    value: "asphalt",
    name: "Asphalt Shingles",
    price: 450,
    description: "Cost-effective and durable, 15-30 year lifespan",
  },
  {
    value: "metal",
    name: "Metal Roofing",
    price: 1200,
    description: "Long-lasting, energy efficient, 40-70 year lifespan",
  },
  {
    value: "corrugated",
    name: "Long Span",
    price: 800,
    description: "Lightweight, weather-resistant, 30-50 year lifespan",
  },
  {
    value: "tile",
    name: "Clay/Concrete Tile",
    price: 1800,
    description: "Premium durability, 50+ year lifespan",
  },
  {
    value: "slate",
    name: "Slate",
    price: 2500,
    description: "Highest quality, 100+ year lifespan",
  },
  {
    value: "wood",
    name: "Wood Shakes",
    price: 900,
    description: "Natural aesthetic, 20-40 year lifespan",
  },
];

export function MaterialSelection({
  material,
  onMaterialChange,
  onRidgeTypeChange,
}: MaterialSelectionProps) {
  const [materials, setMaterials] = useState<Material[]>(fallbackMaterials);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  // Load materials from API on mount
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
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
          setMaterials(dbMaterials);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Failed to load materials from API, using fallback:', error);
        setMaterials(fallbackMaterials);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, []);

  const selectedMaterial = materials.find((m) => m.value === material);

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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="material">Roofing Material</Label>
        <Select value={material} onValueChange={handleMaterialChange}>
          <SelectTrigger>
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
