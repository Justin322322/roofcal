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

interface GutterCalculatorProps {
  gutterLengthA: string;
  gutterSlope: string;
  gutterLengthC: string;
  gutterSize: string;
  onGutterChange: (field: string, value: string) => void;
  calculatedPieces: number;
}

export function GutterCalculator({
  gutterLengthA,
  gutterSlope,
  gutterLengthC,
  gutterSize,
  onGutterChange,
  calculatedPieces,
}: GutterCalculatorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gutterSize">Gutter Size</Label>
        <Select
          value={gutterSize}
          onValueChange={(value) => onGutterChange("gutterSize", value)}
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gutterLengthA">A - Length (m)</Label>
          <Input
            id="gutterLengthA"
            type="number"
            placeholder="Enter A length"
            value={gutterLengthA}
            onChange={(e) => onGutterChange("gutterLengthA", e.target.value)}
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
            value={gutterSlope}
            onChange={(e) => onGutterChange("gutterSlope", e.target.value)}
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
            value={gutterLengthC}
            onChange={(e) => onGutterChange("gutterLengthC", e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      {calculatedPieces > 0 && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Calculated Pieces:</span>
            <span className="font-semibold">{calculatedPieces} pieces</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Formula: (A + B + C) × 2 ÷ 2.3
          </p>
        </div>
      )}
    </div>
  );
}
