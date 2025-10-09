"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MeasurementForm } from "./components/measurement-form"
import { MaterialSelection, materials } from "./components/material-selection"
import { CalculationResults } from "./components/calculation-results"
import { CalculatorIcon, RotateCcwIcon } from "lucide-react"

export function RoofCalculatorContent() {
  const [measurements, setMeasurements] = useState({
    length: "",
    width: "",
    pitch: "",
    roofType: "gable"
  })
  
  const [material, setMaterial] = useState("asphalt")
  const [results, setResults] = useState({
    area: 0,
    materialCost: 0,
    laborCost: 0,
    totalCost: 0
  })

  useEffect(() => {
    calculateRoof()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements, material])

  const calculateRoof = () => {
    const length = parseFloat(measurements.length) || 0
    const width = parseFloat(measurements.width) || 0
    const pitch = parseFloat(measurements.pitch) || 0

    if (length === 0 || width === 0) {
      setResults({
        area: 0,
        materialCost: 0,
        laborCost: 0,
        totalCost: 0
      })
      return
    }

    // Calculate base area
    const baseArea = length * width

    // Apply pitch multiplier
    const pitchRadians = (pitch * Math.PI) / 180
    const pitchMultiplier = 1 / Math.cos(pitchRadians)
    
    // Apply roof type multiplier
    const roofTypeMultipliers: { [key: string]: number } = {
      gable: 2, // Two sides
      hip: 2.2, // Four sides with slightly more surface
      flat: 1, // Single surface
      mansard: 2.5, // Complex four-sided
      gambrel: 2.3 // Barn-style two-sided
    }

    const roofMultiplier = roofTypeMultipliers[measurements.roofType] || 2
    const totalArea = baseArea * pitchMultiplier * roofMultiplier

    // Get material price
    const selectedMaterial = materials.find(m => m.value === material)
    const pricePerSqm = selectedMaterial?.price || 450

    // Calculate costs
    const materialCost = Math.round(totalArea * pricePerSqm)
    const laborCost = Math.round(materialCost * 0.3) // 30% of material cost
    const totalCost = materialCost + laborCost

    setResults({
      area: totalArea,
      materialCost,
      laborCost,
      totalCost
    })
  }

  const handleReset = () => {
    setMeasurements({
      length: "",
      width: "",
      pitch: "",
      roofType: "gable"
    })
    setMaterial("asphalt")
    setResults({
      area: 0,
      materialCost: 0,
      laborCost: 0,
      totalCost: 0
    })
  }

  return (
    <>
      {/* Calculator Content */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          Calculate roofing materials and costs for your project
        </p>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcwIcon className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalculatorIcon className="h-5 w-5" />
                  Measurements
                </CardTitle>
                <CardDescription>
                  Enter your roof dimensions and specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeasurementForm 
                  measurements={measurements}
                  onMeasurementsChange={setMeasurements}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Selection</CardTitle>
                <CardDescription>
                  Choose your preferred roofing material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialSelection 
                  material={material}
                  onMaterialChange={setMaterial}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <CalculationResults 
              area={results.area}
              materialCost={results.materialCost}
              laborCost={results.laborCost}
              totalCost={results.totalCost}
              material={materials.find(m => m.value === material)?.name || ""}
            />

            {results.totalCost > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Add 10% extra material for waste and cuts</p>
                  <p>• Consider additional costs for underlayment and flashing</p>
                  <p>• Labor costs may vary by region and complexity</p>
                  <p>• Steep roofs (over 6:12 pitch) may incur additional charges</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
