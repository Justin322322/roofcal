"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface CalculationResultsProps {
  area: number
  materialCost: number
  laborCost: number
  totalCost: number
  material: string
}

export function CalculationResults({ 
  area, 
  materialCost, 
  laborCost, 
  totalCost,
  material 
}: CalculationResultsProps) {
  if (area === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calculation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Enter measurements to see calculation results
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Calculation Results</span>
          <Badge variant="secondary">{material || "No material"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Roof Area</span>
            <span className="text-base font-medium">{area.toFixed(2)} sq.m</span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Material Cost</span>
            <span className="text-base font-medium">₱{materialCost.toLocaleString()}</span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Labor Cost (30%)</span>
            <span className="text-base font-medium">₱{laborCost.toLocaleString()}</span>
          </div>
          <Separator />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between pt-2">
            <span className="text-base font-semibold">Total Estimated Cost</span>
            <span className="text-2xl font-bold text-primary">₱{totalCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-4 text-xs text-muted-foreground">
          * Estimates include material and labor costs. Additional fees may apply for permits, waste removal, and complex installations.
        </div>
      </CardContent>
    </Card>
  )
}
