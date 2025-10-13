"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Measurements } from "../types";

interface ConsolidatedAdditionalSpecsProps {
  measurements: Measurements;
  onMeasurementsChange: (measurements: Partial<Measurements>) => void;
  roofArea: number;
  calculatedGutterPieces: number;
}

export function ConsolidatedAdditionalSpecs({
  measurements,
  onMeasurementsChange,
  roofArea,
  calculatedGutterPieces,
}: ConsolidatedAdditionalSpecsProps) {
  const handleChange = (field: string, value: string) => {
    onMeasurementsChange({
      [field]: value,
    });
  };

  // Calculate recommended ventilation pieces
  const recommendedVentilationPieces = Math.max(1, Math.ceil(roofArea / 50));

  return (
    <div className="space-y-6">
      {/* Material Thickness Display */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Material Specifications</h4>
        
        <div className="space-y-2">
          <Label className="text-base font-medium">Material Thickness</Label>
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {measurements.materialThickness} mm ({measurements.budgetLevel === "low" ? "Low" : "High"} Budget)
              </span>
              <span className="text-xs text-muted-foreground">
                Automatically set based on budget level above
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Ridge & Gutter Specifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Ridge & Gutter Specifications</h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Ridge Type */}
          <div className="space-y-2">
            <Label htmlFor="ridgeType">Ridge Specification</Label>
            <Select
              value={measurements.ridgeType}
              onValueChange={(value) => handleChange("ridgeType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ridge type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corrugated">Long Span Ridge Cap</SelectItem>
                <SelectItem value="standard">Standard Ridge Cap</SelectItem>
                <SelectItem value="ventilated">Ventilated Ridge Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gutter Size */}
          <div className="space-y-2">
            <Label htmlFor="gutterSize">Gutter Size</Label>
            <Select
              value={measurements.gutterSize}
              onValueChange={(value) => handleChange("gutterSize", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gutter size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (5 inch)</SelectItem>
                <SelectItem value="large">Large (6 inch)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gutter Measurements */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="gutterLengthA">A - Length (m)</Label>
              <Input
                id="gutterLengthA"
                type="number"
                placeholder="Enter A length"
                value={measurements.gutterLengthA}
                onChange={(e) => handleChange("gutterLengthA", e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gutterSlope">B - Slope (m)</Label>
              <Input
                id="gutterSlope"
                type="number"
                placeholder="Enter slope"
                value={measurements.gutterSlope}
                onChange={(e) => handleChange("gutterSlope", e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gutterLengthC">C - Length (m)</Label>
              <Input
                id="gutterLengthC"
                type="number"
                placeholder="Enter C length"
                value={measurements.gutterLengthC}
                onChange={(e) => handleChange("gutterLengthC", e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {calculatedGutterPieces > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Calculated Gutter Pieces: {calculatedGutterPieces}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Insulation & Ventilation */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Insulation & Ventilation</h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Insulation */}
          <div className="space-y-2">
            <Label htmlFor="insulationThickness">
              Insulation Thickness (100% Coverage)
            </Label>
            <Select
              value={measurements.insulationThickness}
              onValueChange={(value) => handleChange("insulationThickness", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select thickness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5mm">5mm</SelectItem>
                <SelectItem value="10mm">10mm</SelectItem>
                <SelectItem value="15mm">15mm</SelectItem>
                <SelectItem value="20mm">20mm</SelectItem>
                <SelectItem value="25mm">25mm</SelectItem>
              </SelectContent>
            </Select>
            {roofArea > 0 && (
              <p className="text-xs text-muted-foreground">
                Coverage: {roofArea.toFixed(2)} sq.m (100% roof area)
              </p>
            )}
          </div>

          {/* Ventilation */}
          <div className="space-y-2">
            <Label htmlFor="ventilationPieces">Number of Ventilation Pieces</Label>
            <Input
              id="ventilationPieces"
              type="number"
              placeholder="0"
              value={measurements.ventilationPieces}
              onChange={(e) => handleChange("ventilationPieces", e.target.value)}
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1 piece per 50 sq.m (Approx. {recommendedVentilationPieces} pieces for your roof)
            </p>
          </div>
        </div>
      </div>

      {/* Tips and Notes */}
      <div className="pt-2 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Tip:</strong> Ventilated ridge caps improve attic ventilation
          and reduce moisture buildup
        </p>
        <p>
          <strong>Note:</strong> Large gutters (6&quot;) handle 50% more water
          than standard (5&quot;) - recommended for heavy rain areas
        </p>
      </div>
    </div>
  );
}
