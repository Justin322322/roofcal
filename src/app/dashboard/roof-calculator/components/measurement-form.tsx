"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Measurements {
  length: string
  width: string
  pitch: string
  roofType: string
}

interface MeasurementFormProps {
  measurements: Measurements
  onMeasurementsChange: (measurements: Measurements) => void
}

export function MeasurementForm({ measurements, onMeasurementsChange }: MeasurementFormProps) {
  const handleChange = (field: string, value: string) => {
    onMeasurementsChange({
      ...measurements,
      [field]: value
    })
  }

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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pitch">Roof Pitch (degrees)</Label>
          <Input
            id="pitch"
            type="number"
            placeholder="Enter pitch"
            value={measurements.pitch}
            onChange={(e) => handleChange("pitch", e.target.value)}
            min="0"
            max="90"
            step="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roofType">Roof Type</Label>
          <Select value={measurements.roofType} onValueChange={(value) => handleChange("roofType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select roof type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gable">Gable</SelectItem>
              <SelectItem value="hip">Hip</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="mansard">Mansard</SelectItem>
              <SelectItem value="gambrel">Gambrel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
