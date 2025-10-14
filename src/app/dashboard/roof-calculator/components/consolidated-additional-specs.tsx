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
        <h4 className="text-sm sm:text-base font-semibold">Material Specifications</h4>
        
        <div className="space-y-2">
          <Label className="text-sm sm:text-base font-medium">Material Thickness</Label>
          <div className="p-3 sm:p-4 bg-muted rounded-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm sm:text-base font-medium">
                {measurements.materialThickness} mm ({measurements.budgetLevel === "low" ? "Low" : "High"} Budget)
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Automatically set based on budget level above
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Ridge & Gutter Specifications */}
      <div className="space-y-4">
        <h4 className="text-sm sm:text-base font-semibold">Ridge & Gutter Specifications</h4>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Ridge Type */}
          <div className="space-y-2">
            <Label htmlFor="ridgeType" className="text-sm font-medium">Ridge Specification</Label>
            <Select
              value={measurements.ridgeType}
              onValueChange={(value) => handleChange("ridgeType", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select ridge type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corrugated">Corrugated Ridge Cap</SelectItem>
                <SelectItem value="longspan">Long Span Ridge Cap</SelectItem>
                <SelectItem value="standard">Standard Ridge Cap</SelectItem>
                <SelectItem value="ventilated">Ventilated Ridge Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gutter Material */}
          <div className="space-y-2">
            <Label htmlFor="gutterMaterial" className="text-sm font-medium">Gutter Material</Label>
            <Select
              value={measurements.gutterMaterial || "pre-painted-gi"}
              onValueChange={(value) => handleChange("gutterMaterial", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select gutter material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre-painted-gi">Pre-painted GI Gutter</SelectItem>
                <SelectItem value="stainless">Stainless Gutter</SelectItem>
                <SelectItem value="pvc">PVC Gutter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gutter Size */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="gutterSize" className="text-sm font-medium">Gutter Size</Label>
            <Select
              value={measurements.gutterSize}
              onValueChange={(value) => handleChange("gutterSize", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select gutter size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cut-16">Cut 16 (16 inches)</SelectItem>
                <SelectItem value="cut-24">Cut 24 (24 inches)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gutter Measurements */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="gutterLengthA" className="text-sm font-medium">A - Length (m)</Label>
              <Input
                id="gutterLengthA"
                type="number"
                placeholder="Enter A length"
                value={measurements.gutterLengthA}
                onChange={(e) => handleChange("gutterLengthA", e.target.value)}
                min="0"
                step="0.1"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gutterSlope" className="text-sm font-medium">B - Slope (m)</Label>
              <Input
                id="gutterSlope"
                type="number"
                placeholder="Enter slope"
                value={measurements.gutterSlope}
                onChange={(e) => handleChange("gutterSlope", e.target.value)}
                min="0"
                step="0.1"
                className="h-11"
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="gutterLengthC" className="text-sm font-medium">C - Length (m)</Label>
              <Input
                id="gutterLengthC"
                type="number"
                placeholder="Enter C length"
                value={measurements.gutterLengthC}
                onChange={(e) => handleChange("gutterLengthC", e.target.value)}
                min="0"
                step="0.1"
                className="h-11"
              />
            </div>
          </div>

          {calculatedGutterPieces > 0 && (
            <div className="p-3 sm:p-4 bg-muted rounded-md">
              <p className="text-sm sm:text-base font-medium">
                Calculated Gutter Pieces: {calculatedGutterPieces}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Insulation & Ventilation - Optional */}
      <div className="space-y-4">
        <h4 className="text-sm sm:text-base font-semibold">Optional Additions</h4>
        
        <div className="space-y-4">
          {/* Insulation Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeInsulation"
              checked={measurements.includeInsulation || false}
              onCheckedChange={(checked) => {
                onMeasurementsChange({
                  includeInsulation: checked as boolean,
                  ...(checked ? {} : { insulationType: undefined, insulationThickness: "" }),
                });
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
            <div className="ml-2 sm:ml-6 space-y-4 border-l-2 border-primary/20 pl-3 sm:pl-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Insulation Type */}
                <div className="space-y-2">
                  <Label htmlFor="insulationType" className="text-sm font-medium">Insulation Type</Label>
                  <Select
                    value={measurements.insulationType}
                    onValueChange={(value) => handleChange("insulationType", value)}
                  >
                    <SelectTrigger className="h-11">
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
                  <Label htmlFor="insulationThickness" className="text-sm font-medium">Insulation Thickness (100% Coverage)</Label>
                  <Select
                    value={measurements.insulationThickness}
                    onValueChange={(value) => handleChange("insulationThickness", value)}
                  >
                    <SelectTrigger className="h-11">
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
                onMeasurementsChange({
                  includeVentilation: checked as boolean,
                  ...(checked ? {} : { ventilationType: undefined, ventilationPieces: "" }),
                });
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
            <div className="ml-2 sm:ml-6 space-y-4 border-l-2 border-primary/20 pl-3 sm:pl-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ventilation Type */}
                <div className="space-y-2">
                  <Label htmlFor="ventilationType" className="text-sm font-medium">Ventilation Type</Label>
                  <Select
                    value={measurements.ventilationType}
                    onValueChange={(value) => handleChange("ventilationType", value)}
                  >
                    <SelectTrigger className="h-11">
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
                  <Label htmlFor="ventilationPieces" className="text-sm font-medium">Number of Ventilation Pieces</Label>
                  <Input
                    id="ventilationPieces"
                    type="number"
                    placeholder="0"
                    value={measurements.ventilationPieces}
                    onChange={(e) => handleChange("ventilationPieces", e.target.value)}
                    min="0"
                    className="h-11"
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
      <div className="pt-2 text-xs sm:text-sm text-muted-foreground space-y-1.5">
        <p>
          <strong className="font-semibold">Tip:</strong> Insulation helps regulate temperature and reduce energy costs
        </p>
        <p>
          <strong className="font-semibold">Tip:</strong> Ventilation reduces moisture buildup and extends roof life
        </p>
        <p>
          <strong className="font-semibold">Note:</strong> Large gutters (6&quot;) handle 50% more water
          than standard (5&quot;) - recommended for heavy rain areas
        </p>
      </div>
    </div>
  );
}
