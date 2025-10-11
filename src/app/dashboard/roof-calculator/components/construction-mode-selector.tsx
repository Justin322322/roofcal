"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { HammerIcon, WrenchIcon } from "lucide-react";

interface ConstructionModeSelectorProps {
  mode: "new" | "repair";
  onModeChange: (mode: "new" | "repair") => void;
}

export function ConstructionModeSelector({
  mode,
  onModeChange,
}: ConstructionModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Construction Mode</Label>
      <RadioGroup
        value={mode}
        onValueChange={(value) => onModeChange(value as "new" | "repair")}
        className="grid grid-cols-2 gap-4"
      >
        <div>
          <RadioGroupItem value="new" id="mode-new" className="peer sr-only" />
          <Label
            htmlFor="mode-new"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
          >
            <HammerIcon className="mb-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">New Construction</div>
              <div className="text-xs text-muted-foreground mt-1">
                Full installation
              </div>
              <div className="text-xs font-medium text-primary mt-1">
                Labor: 40%
              </div>
            </div>
          </Label>
        </div>

        <div>
          <RadioGroupItem
            value="repair"
            id="mode-repair"
            className="peer sr-only"
          />
          <Label
            htmlFor="mode-repair"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
          >
            <WrenchIcon className="mb-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Repair</div>
              <div className="text-xs text-muted-foreground mt-1">
                Includes removal
              </div>
              <div className="text-xs font-medium text-primary mt-1">
                Labor: 20%
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
