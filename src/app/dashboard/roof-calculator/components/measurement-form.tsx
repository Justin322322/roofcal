"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Measurements } from "../types";

interface MeasurementFormProps {
  measurements: Measurements;
  onMeasurementsChange: (measurements: Measurements) => void;
}

export function MeasurementForm({
  measurements,
  onMeasurementsChange,
}: MeasurementFormProps) {
  const handleChange = (field: string, value: string) => {
    // Special handling for floors field to limit to 5
    if (field === "floors") {
      const numericValue = parseInt(value, 10);
      if (
        value === "" ||
        (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5)
      ) {
        onMeasurementsChange({
          ...measurements,
          [field]: value,
        });
      }
      return;
    }

    // Validation for length and width
    if (field === "length" || field === "width") {
      const numericValue = parseFloat(value);
      if (value === "" || (!isNaN(numericValue) && numericValue >= 1)) {
        onMeasurementsChange({
          ...measurements,
          [field]: value,
        });
      }
      return;
    }

    onMeasurementsChange({
      ...measurements,
      [field]: value,
    });
  };

  // Check for validation warnings
  const length = parseFloat(measurements.length) || 0;
  const width = parseFloat(measurements.width) || 0;
  const showUnrealisticWarning = (length > 0 && length < 1) || (width > 0 && width < 1);

  return (
    <div className="space-y-4">
      
      {showUnrealisticWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: Very small dimensions detected. Please verify your measurements are in meters and realistic for a roofing project.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 min-w-0">
        <div className="space-y-2">
          <Label htmlFor="length">Length (meters)</Label>
          <Input
            id="length"
            type="number"
            placeholder="Enter length (min: 1m)"
            value={measurements.length}
            onChange={(e) => handleChange("length", e.target.value)}
            min="1"
            max="1000"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width">Width (meters)</Label>
          <Input
            id="width"
            type="number"
            placeholder="Enter width (min: 1m)"
            value={measurements.width}
            onChange={(e) => handleChange("width", e.target.value)}
            min="1"
            max="1000"
            step="0.1"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
        <div className="space-y-2">
          <Label htmlFor="pitch">Roof Pitch</Label>
          <Select
            value={measurements.pitch}
            onValueChange={(value) => handleChange("pitch", value)}
          >
            <SelectTrigger className="max-w-full truncate">
              <SelectValue placeholder="Select roof pitch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">
                5° - Flat roof (requires excellent drainage)
              </SelectItem>
              <SelectItem value="10">
                10° - Low slope (good drainage needed)
              </SelectItem>
              <SelectItem value="15">
                15° - Good for heavy rain areas
              </SelectItem>
              <SelectItem value="20">20° - Excellent for heavy rain</SelectItem>
              <SelectItem value="25">25° - Ideal for heavy rainfall</SelectItem>
              <SelectItem value="30">
                30° - Perfect for heavy rain areas
              </SelectItem>
              <SelectItem value="35">
                35° - Great for heavy rain & snow
              </SelectItem>
              <SelectItem value="40">40° - Excellent water runoff</SelectItem>
              <SelectItem value="45">
                45° - Very steep (high installation cost)
              </SelectItem>
              <SelectItem value="50">
                50° - Extremely steep (specialized labor)
              </SelectItem>
              <SelectItem value="60">
                60° - Maximum steepness (complex installation)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="floors">Number of Floors</Label>
          <Input
            id="floors"
            type="number"
            placeholder="Enter floors"
            value={measurements.floors}
            onChange={(e) => handleChange("floors", e.target.value)}
            min="1"
            max="5"
            step="1"
            className="text-center"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roofType">Roof Type</Label>
          <Select
            value={measurements.roofType}
            onValueChange={(value) => handleChange("roofType", value)}
          >
            <SelectTrigger className="max-w-full truncate">
              <SelectValue placeholder="Select roof type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gable">Gable (+5%)</SelectItem>
              <SelectItem value="shed">Shed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
