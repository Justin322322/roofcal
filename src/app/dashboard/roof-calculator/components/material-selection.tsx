"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MaterialSelectionProps {
  material: string;
  onMaterialChange: (material: string) => void;
}

const materials = [
  {
    value: "asphalt",
    name: "Asphalt Shingles",
    price: 450,
    description: "Cost-effective and durable, 15-30 year lifespan",
  },
  {
    value: "metal",
    name: "Metal Roofing",
    price: 1200,
    description: "Long-lasting, energy efficient, 40-70 year lifespan",
  },
  {
    value: "tile",
    name: "Clay/Concrete Tile",
    price: 1800,
    description: "Premium durability, 50+ year lifespan",
  },
  {
    value: "slate",
    name: "Slate",
    price: 2500,
    description: "Highest quality, 100+ year lifespan",
  },
  {
    value: "wood",
    name: "Wood Shakes",
    price: 900,
    description: "Natural aesthetic, 20-40 year lifespan",
  },
];

export function MaterialSelection({
  material,
  onMaterialChange,
}: MaterialSelectionProps) {
  const selectedMaterial = materials.find((m) => m.value === material);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="material">Roofing Material</Label>
        <Select value={material} onValueChange={onMaterialChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((mat) => (
              <SelectItem key={mat.value} value={mat.value}>
                {mat.name} - ₱{mat.price.toLocaleString()}/sq.m
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMaterial && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedMaterial.name}</CardTitle>
            <CardDescription>{selectedMaterial.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Price per sq.m
              </span>
              <span className="text-lg font-semibold">
                ₱{selectedMaterial.price.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { materials };
