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
import { Button } from "@/components/ui/button";

interface ConsolidatedMaterialSelectionProps {
  material: string;
  onMaterialChange: (material: string) => void;
  screwType: string;
  onScrewTypeChange: (screwType: string) => void;
  budgetLevel: string;
  onBudgetLevelChange: (budgetLevel: string, materialThickness: string) => void;
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

// No fallbacks; rely exclusively on API

export function ConsolidatedMaterialSelection({
  material,
  onMaterialChange,
  screwType,
  onScrewTypeChange,
  budgetLevel,
  onBudgetLevelChange,
}: ConsolidatedMaterialSelectionProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [screwTypes, setScrewTypes] = useState<ScrewType[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingScrews, setIsLoadingScrews] = useState(true);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [screwsError, setScrewsError] = useState<string | null>(null);

  // Load materials from API
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
        setMaterialsError(null);
        
        // Load all materials from pricing config
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
      } catch (error) {
        console.error('Failed to load materials from API:', error);
        setMaterials([]);
        setMaterialsError('Failed to load materials. Please try again.');
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, []);

  // Load screw types from API
  useEffect(() => {
    const loadScrewTypes = async () => {
      try {
        setIsLoadingScrews(true);
        setScrewsError(null);
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
        console.error('Failed to load screw types from API:', error);
        setScrewTypes([]);
        setScrewsError('Failed to load screw types. Please try again.');
      } finally {
        setIsLoadingScrews(false);
      }
    };

    loadScrewTypes();
  }, []);

  const selectedMaterial = materials.find((m) => m.value === material);
  const selectedScrew = screwTypes.find((screw) => screw.value === screwType);

  // Filter materials based on budget level (thickness)
  const filteredMaterials = materials.filter((mat) => {
    if (budgetLevel === "low") {
      // Low budget: only show 0.4mm thickness materials
      return mat.value.includes("-0.4");
    } else if (budgetLevel === "high") {
      // High budget: only show 0.5mm thickness materials
      return mat.value.includes("-0.5");
    }
    return true; // Show all if no budget level selected
  });

  // Do not auto-select; require explicit user choice

  return (
    <div className="space-y-6">
      {/* Budget Level Selection */}
      <div className="space-y-2">
        <Label className="text-sm sm:text-base font-medium">Budget Level</Label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button
            variant={budgetLevel === "low" ? "default" : "outline"}
            onClick={() => onBudgetLevelChange("low", "0.4")}
            className="h-auto sm:h-12 py-3 sm:py-0"
          >
            <div className="text-left w-full">
              <div className="font-medium text-sm sm:text-base">Low Budget</div>
              <div className="text-xs opacity-70">0.4mm thickness</div>
            </div>
          </Button>
          <Button
            variant={budgetLevel === "high" ? "default" : "outline"}
            onClick={() => onBudgetLevelChange("high", "0.5")}
            className="h-auto sm:h-12 py-3 sm:py-0"
          >
            <div className="text-left w-full">
              <div className="font-medium text-sm sm:text-base">High Budget</div>
              <div className="text-xs opacity-70">0.5mm thickness</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Material Selection */}
      <div className="space-y-2">
        <Label className="text-sm sm:text-base font-medium">Roofing Material</Label>
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {filteredMaterials.length} materials matching your budget level
        </div>
        {isLoadingMaterials ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <>
          {materialsError && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
              <span className="text-xs sm:text-sm">{materialsError}</span>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  setIsLoadingMaterials(true);
                  setMaterialsError(null);
                  const response = await fetch('/api/pricing?category=materials');
                  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                  const result = await response.json();
                  if (result.success && result.data) {
                    const dbMaterials = result.data.map((m: PricingConfigAPIResponse) => ({
                      value: m.name,
                      name: m.label,
                      price: m.price,
                      description: m.description || '',
                    }));
                    setMaterials(dbMaterials);
                  } else {
                    throw new Error('Invalid API response format');
                  }
                } catch (e) {
                  console.error(e);
                  setMaterialsError('Failed to load materials. Please try again.');
                } finally {
                  setIsLoadingMaterials(false);
                }
              }}>Retry</Button>
            </div>
          )}
          <Select value={material} onValueChange={onMaterialChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {filteredMaterials.map((mat) => (
                <SelectItem key={mat.value} value={mat.value}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-1">
                    <span className="text-sm">{mat.name}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">₱{mat.price.toLocaleString()}/sq.m</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </>
        )}
      </div>

      {/* Screw Type Selection */}
      <div className="space-y-2">
        <Label className="text-sm sm:text-base font-medium">Screw Type</Label>
        {isLoadingScrews ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <>
          {screwsError && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
              <span className="text-xs sm:text-sm">{screwsError}</span>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  setIsLoadingScrews(true);
                  setScrewsError(null);
                  const response = await fetch('/api/pricing?category=screw_types');
                  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                  const result = await response.json();
                  if (result.success && result.data) {
                    const dbScrewTypes = result.data.map((st: PricingConfigAPIResponse) => ({
                      value: st.name,
                      name: st.label,
                      price: st.price,
                    }));
                    setScrewTypes(dbScrewTypes);
                  } else {
                    throw new Error('Invalid API response format');
                  }
                } catch (e) {
                  console.error(e);
                  setScrewsError('Failed to load screw types. Please try again.');
                } finally {
                  setIsLoadingScrews(false);
                }
              }}>Retry</Button>
            </div>
          )}
          <Select value={screwType} onValueChange={onScrewTypeChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select Screw Type" />
            </SelectTrigger>
            <SelectContent>
              {screwTypes.map((screw) => (
                <SelectItem key={screw.value} value={screw.value}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-1">
                    <span className="text-sm">{screw.name}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">₱{screw.price.toFixed(2)}/pc</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </>
        )}
      </div>

      {/* Selected Material Details */}
      {selectedMaterial && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">{selectedMaterial.name}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{selectedMaterial.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Price per sq.m</span>
              <span className="text-base sm:text-lg font-semibold">
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
            <CardTitle className="text-sm sm:text-base">{selectedScrew.name}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              High-quality screw for secure roof installation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Price per piece</span>
              <span className="text-base sm:text-lg font-semibold">
                ₱{selectedScrew.price.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
