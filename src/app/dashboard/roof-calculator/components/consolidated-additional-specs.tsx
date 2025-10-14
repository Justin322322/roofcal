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
import { Checkbox } from "@/components/ui/checkbox";
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

      {/* Insulation & Ventilation - Optional */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Optional Additions</h4>
        
        <div className="space-y-4">
          {/* Insulation Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeInsulation"
              checked={measurements.includeInsulation || false}
              onCheckedChange={(checked) => {
                handleChange("includeInsulation", checked ? "true" : "false");
                // Reset insulation values when unchecked
                if (!checked) {
                  handleChange("insulationType", "");
                  handleChange("insulationThickness", "");
                }
              }}
            />
            <Label
              htmlFor="includeInsulation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Include Insulation
            </Label>
          </div>

          {/* Insulation Fields - Only show when enabled */}
          {measurements.includeInsulation && (
            <div className="ml-6 space-y-4 border-l-2 border-primary/20 pl-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Insulation Type */}
                <div className="space-y-2">
                  <Label htmlFor="insulationType">Insulation Type</Label>
                  <Select
                    value={measurements.insulationType}
                    onValueChange={(value) => handleChange("insulationType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select insulation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiberglass-batt">Fiberglass batt</SelectItem>
                      <SelectItem value="foam-board">Foam board</SelectItem>
                      <SelectItem value="reflective-roll">Reflective roll</SelectItem>
                      <SelectItem value="spray-foam">Spray foam</SelectItem>
                      <SelectItem value="mineral-wool">Mineral wool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Insulation Thickness */}
                <div className="space-y-2">
                  <Label htmlFor="insulationThickness">Insulation Thickness (100% Coverage)</Label>
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
              </div>
            </div>
          )}

          {/* Ventilation Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeVentilation"
              checked={measurements.includeVentilation || false}
              onCheckedChange={(checked) => {
                handleChange("includeVentilation", checked ? "true" : "false");
                // Reset ventilation values when unchecked
                if (!checked) {
                  handleChange("ventilationType", "");
                  handleChange("ventilationPieces", "");
                }
              }}
            />
            <Label
              htmlFor="includeVentilation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Include Ventilation
            </Label>
          </div>

          {/* Ventilation Fields - Only show when enabled */}
          {measurements.includeVentilation && (
            <div className="ml-6 space-y-4 border-l-2 border-primary/20 pl-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Ventilation Type */}
                <div className="space-y-2">
                  <Label htmlFor="ventilationType">Ventilation Type</Label>
                  <Select
                    value={measurements.ventilationType}
                    onValueChange={(value) => handleChange("ventilationType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ventilation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ridge-vent">Ridge vent</SelectItem>
                      <SelectItem value="turbine-vent">Turbine vent</SelectItem>
                      <SelectItem value="static-vent">Static roof vent</SelectItem>
                      <SelectItem value="soffit-vent">Soffit vent</SelectItem>
                      <SelectItem value="exhaust-fan">Exhaust fan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ventilation Pieces */}
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
          )}
        </div>
      </div>

      {/* Tips and Notes */}
      <div className="pt-2 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Tip:</strong> Insulation helps regulate temperature and reduce energy costs
        </p>
        <p>
          <strong>Tip:</strong> Ventilation reduces moisture buildup and extends roof life
        </p>
        <p>
          <strong>Note:</strong> Large gutters (6&quot;) handle 50% more water
          than standard (5&quot;) - recommended for heavy rain areas
        </p>
      </div>
    </div>
  );
}
