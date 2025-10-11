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

interface InsulationVentilationProps {
  insulationThickness: string;
  ventilationPieces: string;
  onChange: (field: string, value: string) => void;
  roofArea: number;
}

export function InsulationVentilation({
  insulationThickness,
  ventilationPieces,
  onChange,
  roofArea,
}: InsulationVentilationProps) {
  return (
    <div className="space-y-4">
      {/* Insulation */}
      <div className="space-y-2">
        <Label htmlFor="insulationThickness">
          Insulation Thickness (100% Coverage)
        </Label>
        <Select
          value={insulationThickness}
          onValueChange={(value) => onChange("insulationThickness", value)}
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
          placeholder="Enter number of pieces"
          value={ventilationPieces}
          onChange={(e) => onChange("ventilationPieces", e.target.value)}
          min="0"
          step="1"
        />
        <p className="text-xs text-muted-foreground">
          Recommended: 1 piece per 50 sq.m (Approx. {Math.ceil(roofArea / 50)}{" "}
          pieces for your roof)
        </p>
      </div>
    </div>
  );
}
