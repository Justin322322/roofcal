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
import type { Measurements } from "../types";

interface MeasurementFormProps {
  measurements: Measurements;
  onMeasurementsChange: (measurements: Measurements) => void;
  currentMaterial?: string;
}

export function MeasurementForm({
  measurements,
  onMeasurementsChange,
  currentMaterial = "asphalt",
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

    onMeasurementsChange({
      ...measurements,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="length">Length (meters)</Label>
          <Input
            id="length"
            type="number"
            placeholder="Enter length"
            value={measurements.length}
            onChange={(e) => handleChange("length", e.target.value)}
            min="0"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width">Width (meters)</Label>
          <Input
            id="width"
            type="number"
            placeholder="Enter width"
            value={measurements.width}
            onChange={(e) => handleChange("width", e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr_2fr]">
        <div className="space-y-2">
          <Label htmlFor="pitch">Roof Pitch</Label>
          <Select
            value={measurements.pitch}
            onValueChange={(value) => handleChange("pitch", value)}
          >
            <SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Select roof type" />
            </SelectTrigger>
            <SelectContent>
              {currentMaterial === "corrugated" ? (
                <>
                  <SelectItem value="gable">Gable</SelectItem>
                  <SelectItem value="shed">Shed</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="gable">Gable</SelectItem>
                  <SelectItem value="shed">Shed</SelectItem>
                  <SelectItem value="hip">Hip</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="mansard">Mansard</SelectItem>
                  <SelectItem value="gambrel">Gambrel</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
