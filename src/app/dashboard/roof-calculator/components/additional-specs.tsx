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
        <Label htmlFor="budgetLevel">Budget Level</Label>
        <Select
          value={measurements.budgetLevel}
          onValueChange={(value) => handleChange("budgetLevel", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select budget level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Cost-effective solutions</SelectItem>
            <SelectItem value="medium">
              Medium - Balanced quality & cost
            </SelectItem>
            <SelectItem value="high">
              High - Premium materials & longevity
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Material Thickness */}
      <div className="space-y-2">
        <Label htmlFor="materialThickness">Material Thickness</Label>
        <Select
          value={measurements.materialThickness}
          onValueChange={(value) => handleChange("materialThickness", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select thickness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard - Good durability</SelectItem>
            <SelectItem value="premium">
              Premium - Enhanced durability
            </SelectItem>
            <SelectItem value="heavy">
              Heavy Duty - Maximum durability
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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
