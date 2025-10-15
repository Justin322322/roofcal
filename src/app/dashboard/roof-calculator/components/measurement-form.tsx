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
    // Special handling for floors field to limit to 99
    if (field === "floors") {
      const numericValue = parseInt(value, 10);
      if (
        value === "" ||
        (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 99)
      ) {
        onMeasurementsChange({
          ...measurements,
          [field]: value,
        });
      }
      return;
    }

    // Validation for length and width with guardrails
    if (field === "length" || field === "width") {
      const numericValue = parseFloat(value);
      if (value === "" || (!isNaN(numericValue) && numericValue >= 1)) {
        let newMeasurements = {
          ...measurements,
          [field]: value,
        };
        
        // Apply guardrails: Length should not be lower than width
        const length = parseFloat(newMeasurements.length) || 0;
        const width = parseFloat(newMeasurements.width) || 0;
        
        // If user is entering length and it's lower than width, auto-adjust width
        if (field === "length" && length > 0 && width > 0 && length < width) {
          newMeasurements = {
            ...newMeasurements,
            width: length.toString(), // Set width to match length
          };
        }
        
        // If user is entering width and it's higher than length, auto-adjust length
        if (field === "width" && width > 0 && length > 0 && length < width) {
          newMeasurements = {
            ...newMeasurements,
            length: width.toString(), // Set length to match width
          };
        }
        
        onMeasurementsChange(newMeasurements);
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
  const showLengthWarning = length > 0 && width > 0 && length < width;
  const showUnrealisticWarning = (length > 0 && length < 1) || (width > 0 && width < 1);

  return (
    <div className="space-y-4">
      {showLengthWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Length ({length}m) was lower than width ({width}m). The system has automatically adjusted the values to maintain proper proportions.
          </AlertDescription>
        </Alert>
      )}
      
      {showUnrealisticWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Warning: Very small dimensions detected. Please verify your measurements are in meters and realistic for a roofing project.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 min-w-0">
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
          <p className="text-xs text-muted-foreground">
            Length should be ≥ width for proper roof proportions
          </p>
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
          <p className="text-xs text-muted-foreground">
            Width should be ≤ length for proper roof proportions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr_2fr] min-w-0">
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
            max="99"
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
