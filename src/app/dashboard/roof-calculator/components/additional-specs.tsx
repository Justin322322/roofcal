"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Measurements {
  materialThickness: string;
  ridgeType: string;
  gutterSize: string;
  budgetLevel: string;
}

interface AdditionalSpecsProps {
  measurements: Measurements;
  onMeasurementsChange: (measurements: Partial<Measurements>) => void;
}

export function AdditionalSpecs({
  measurements,
  onMeasurementsChange,
}: AdditionalSpecsProps) {
  const handleChange = (field: string, value: string) => {
    onMeasurementsChange({
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Budget Level */}
      <div className="space-y-2">
        <Label htmlFor="budgetLevel" className="text-sm font-medium">Budget Level</Label>
        <Select
          value={measurements.budgetLevel}
          onValueChange={(value) => {
            // Map budget to thickness: low -> 0.4mm, high -> 0.5mm
            handleChange("budgetLevel", value);
            handleChange(
              "materialThickness",
              value === "high" ? "0.5" : "0.4"
            );
          }}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select budget level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Material Thickness */}
      <div className="space-y-2">
        <Label htmlFor="materialThickness" className="text-sm font-medium">Material Thickness</Label>
        <Select
          value={measurements.materialThickness}
          onValueChange={(value) => handleChange("materialThickness", value)}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select thickness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.4">0.4 mm (Low)</SelectItem>
            <SelectItem value="0.5">0.5 mm (High)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
              {/* Business rule: when only corrugated is allowed, keep ridge types aligned */}
              <SelectItem value="corrugated">Corrugated Ridge Cap</SelectItem>
              <SelectItem value="standard">Standard Ridge Cap</SelectItem>
              <SelectItem value="ventilated">Ventilated Ridge Cap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gutter Size */}
        <div className="space-y-2">
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

      <div className="pt-2 text-xs sm:text-sm text-muted-foreground space-y-1.5">
        <p>
          <strong className="font-semibold">Tip:</strong> Ventilated ridge caps improve attic ventilation
          and reduce moisture buildup
        </p>
        <p>
          <strong className="font-semibold">Note:</strong> Large gutters (6&quot;) handle 50% more water
          than standard (5&quot;) - recommended for heavy rain areas
        </p>
      </div>
    </div>
  );
}
