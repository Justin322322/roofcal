"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { SCREW_TYPES } from "../constants";

interface ConsolidatedMaterialSelectionProps {
  material: string;
  onMaterialChange: (material: string) => void;
  screwType: string;
  onScrewTypeChange: (screwType: string) => void;
  budgetLevel: string;
  onBudgetLevelChange: (budgetLevel: string, materialThickness: string) => void;
  selectedWarehouseId?: string;
}

interface Material {
  value: string;
  name: string;
  price: number;
  description: string;
}

interface ScrewType {
  value: string;
  name: string;
  price: number;
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
    name: "Long Span (0.4mm)",
    price: 650,
    description: "Lightweight, weather-resistant, 30-50 year lifespan - Low budget option",
  },
  {
    value: "corrugated-0.5",
    name: "Long Span (0.5mm)",
    price: 800,
    description: "Lightweight, weather-resistant, 30-50 year lifespan - High budget option",
  },
  {
    value: "corrugated",
    name: "Long Span (Default)",
    price: 800,
    description: "Lightweight, weather-resistant, 30-50 year lifespan",
  },
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

// Convert SCREW_TYPES constant to array format as fallback
const fallbackScrewTypes: ScrewType[] = Object.entries(SCREW_TYPES).map(([key, value]) => ({
  value: key,
  name: value.name,
  price: value.price,
}));

export function ConsolidatedMaterialSelection({
  material,
  onMaterialChange,
  screwType,
  onScrewTypeChange,
  budgetLevel,
  onBudgetLevelChange,
  selectedWarehouseId,
}: ConsolidatedMaterialSelectionProps) {
  const [materials, setMaterials] = useState<Material[]>(fallbackMaterials);
  const [screwTypes, setScrewTypes] = useState<ScrewType[]>(fallbackScrewTypes);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingScrews, setIsLoadingScrews] = useState(true);

  // Load materials from API
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

  // Load screw types from API
  useEffect(() => {
    const loadScrewTypes = async () => {
      try {
        setIsLoadingScrews(true);
        const response = await fetch('/api/pricing?category=screw_types');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform API data to match expected format
          const dbScrewTypes = result.data.map((screwType: PricingConfigAPIResponse) => ({
            value: screwType.name,
            name: screwType.label,
            price: screwType.price,
          }));
          setScrewTypes(dbScrewTypes);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Failed to load screw types from API, using fallback:', error);
        setScrewTypes(fallbackScrewTypes);
      } finally {
        setIsLoadingScrews(false);
      }
    };

    loadScrewTypes();
  }, []);

  const selectedMaterial = materials.find((m) => m.value === material);
  const selectedScrew = screwTypes.find((screw) => screw.value === screwType);

  return (
    <div className="space-y-6">
      {/* Budget Level Selection */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Budget Level</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={budgetLevel === "low" ? "default" : "outline"}
            onClick={() => onBudgetLevelChange("low", "0.4")}
            className="h-12"
          >
            <div className="text-left">
              <div className="font-medium">Low Budget</div>
              <div className="text-xs opacity-70">0.4mm thickness</div>
            </div>
          </Button>
          <Button
            variant={budgetLevel === "high" ? "default" : "outline"}
            onClick={() => onBudgetLevelChange("high", "0.5")}
            className="h-12"
          >
            <div className="text-left">
              <div className="font-medium">High Budget</div>
              <div className="text-xs opacity-70">0.5mm thickness</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Material Selection */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Roofing Material</Label>
        {selectedWarehouseId && (
          <div className="text-sm text-muted-foreground">
            Showing {materials.length} materials from selected warehouse
          </div>
        )}
        {isLoadingMaterials ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={material} onValueChange={onMaterialChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((mat) => (
                <SelectItem key={mat.value} value={mat.value}>
                  <div className="flex justify-between items-center w-full">
                    <span>{mat.name}</span>
                    <span className="text-muted-foreground ml-2">₱{mat.price.toLocaleString()}/sq.m</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Screw Type Selection */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Screw Type</Label>
        {isLoadingScrews ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={screwType} onValueChange={onScrewTypeChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select Screw Type" />
            </SelectTrigger>
            <SelectContent>
              {screwTypes.map((screw) => (
                <SelectItem key={screw.value} value={screw.value}>
                  <div className="flex justify-between items-center w-full">
                    <span>{screw.name}</span>
                    <span className="text-muted-foreground ml-2">₱{screw.price.toFixed(2)}/pc</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Selected Material Details */}
      {selectedMaterial && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedMaterial.name}</CardTitle>
            <CardDescription>{selectedMaterial.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price per sq.m</span>
              <span className="text-lg font-semibold">
                ₱{selectedMaterial.price.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Screw Details */}
      {selectedScrew && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedScrew.name}</CardTitle>
            <CardDescription>
              High-quality screw for secure roof installation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price per piece</span>
              <span className="text-lg font-semibold">
                ₱{selectedScrew.price.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
