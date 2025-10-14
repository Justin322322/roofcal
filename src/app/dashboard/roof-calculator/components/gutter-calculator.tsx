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
        <Label htmlFor="gutterSize" className="text-sm font-medium">Gutter Size</Label>
        <Select
          value={gutterSize}
          onValueChange={(value) => onGutterChange("gutterSize", value)}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gutterLengthA" className="text-sm font-medium">A - Length (m)</Label>
          <Input
            id="gutterLengthA"
            type="number"
            placeholder="Enter A length"
            value={gutterLengthA}
            onChange={(e) => onGutterChange("gutterLengthA", e.target.value)}
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
            value={gutterSlope}
            onChange={(e) => onGutterChange("gutterSlope", e.target.value)}
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
            value={gutterLengthC}
            onChange={(e) => onGutterChange("gutterLengthC", e.target.value)}
            min="0"
            step="0.1"
            className="h-11"
          />
        </div>
      </div>

      {calculatedPieces > 0 && (
        <div className="rounded-md bg-muted p-3 sm:p-4 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-muted-foreground">Calculated Pieces:</span>
            <span className="font-semibold text-base sm:text-lg">{calculatedPieces} pieces</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Formula: (A + B + C) × 2 ÷ 2.3
          </p>
        </div>
      )}
    </div>
  );
}
