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
import { SCREW_TYPES } from "../constants";

interface ScrewSelectionProps {
  screwType: string;
  onScrewTypeChange: (screwType: string) => void;
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

// Convert SCREW_TYPES constant to array format as fallback
const fallbackScrewTypes: ScrewType[] = Object.entries(SCREW_TYPES).map(([key, value]) => ({
  value: key,
  name: value.name,
  price: value.price,
}));

export function ScrewSelection({
  screwType,
  onScrewTypeChange,
}: ScrewSelectionProps) {
  const [screwTypes, setScrewTypes] = useState<ScrewType[]>(fallbackScrewTypes);
  const [isLoading, setIsLoading] = useState(true);

  // Load screw types from API
  useEffect(() => {
    const loadScrewTypes = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    loadScrewTypes();
  }, []);

  const selectedScrew = screwTypes.find((screw) => screw.value === screwType);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="screw-type">Screw Type</Label>
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
        <Label htmlFor="screw-type">Screw Type</Label>
        <Select value={screwType} onValueChange={onScrewTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Screw Type" />
          </SelectTrigger>
          <SelectContent>
            {screwTypes.map((screw) => (
              <SelectItem key={screw.value} value={screw.value}>
                {screw.name} (₱{screw.price.toFixed(2)}/pc)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
              <span className="text-sm text-muted-foreground">
                Price per piece
              </span>
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
