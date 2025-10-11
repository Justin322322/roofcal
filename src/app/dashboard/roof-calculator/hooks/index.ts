"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "../types";
import { analyzeProject } from "@/lib/decision-tree";
import { materials } from "../components/material-selection";

export function useRoofCalculator() {
  const [measurements, setMeasurements] = useState<Measurements>({
    length: "",
    width: "",
    pitch: "30",
    roofType: "gable",
    floors: "1",
    materialThickness: "standard",
    ridgeType: "standard",
    gutterSize: "standard",
    budgetLevel: "medium",
  });

  const [material, setMaterial] = useState("asphalt");

  const [results, setResults] = useState<CalculationResults>({
    area: 0,
    materialCost: 0,
    laborCost: 0,
    totalCost: 0,
  });

  const [decisionTree, setDecisionTree] = useState<DecisionTreeResult>({
    materialRecommendation: {
      recommendedMaterial: "asphalt",
      reason: "Enter measurements to get recommendations",
      isOptimal: true,
    },
    complexity: {
      score: 1,
      factors: [],
      level: "low",
    },
    optimizationTips: [],
  });

  const calculateRoof = useCallback(() => {
    const length = parseFloat(measurements.length) || 0;
    const width = parseFloat(measurements.width) || 0;
    const pitch = parseFloat(measurements.pitch) || 0;

    if (length === 0 || width === 0) {
      setResults({
        area: 0,
        materialCost: 0,
        laborCost: 0,
        totalCost: 0,
      });
      setDecisionTree({
        materialRecommendation: {
          recommendedMaterial: material,
          reason: "Enter measurements to get recommendations",
          isOptimal: true,
        },
        complexity: {
          score: 1,
          factors: [],
          level: "low",
        },
        optimizationTips: [],
      });
      return;
    }

    // Calculate base area
    const baseArea = length * width;

    // Apply pitch multiplier
    const pitchRadians = (pitch * Math.PI) / 180;
    const pitchMultiplier = 1 / Math.cos(pitchRadians);

    // Apply roof type multiplier
    const roofTypeMultipliers: Record<string, number> = {
      gable: 2, // Two sides
      hip: 2.2, // Four sides with slightly more surface
      flat: 1, // Single surface
      mansard: 2.5, // Complex four-sided
      gambrel: 2.3, // Barn-style two-sided
    };

    const roofMultiplier = roofTypeMultipliers[measurements.roofType] || 2;
    const totalArea = baseArea * pitchMultiplier * roofMultiplier;

    // Get material price
    const selectedMaterial = materials.find((m) => m.value === material);
    const pricePerSqm = selectedMaterial?.price || 450;

    // Calculate costs
    const materialCost = Math.round(totalArea * pricePerSqm);
    const laborCost = Math.round(materialCost * 0.3); // 30% of material cost
    const totalCost = materialCost + laborCost;

    setResults({
      area: totalArea,
      materialCost,
      laborCost,
      totalCost,
    });

    // Run decision tree analysis
    const floors = parseFloat(measurements.floors) || 1;
    const analysis = analyzeProject({
      roofType: measurements.roofType,
      pitch,
      area: totalArea,
      material,
      floors,
      materialThickness: measurements.materialThickness,
      ridgeType: measurements.ridgeType,
      gutterSize: measurements.gutterSize,
      budgetLevel: measurements.budgetLevel,
    });

    setDecisionTree({
      materialRecommendation: analysis.materialRecommendation,
      complexity: analysis.complexity,
      optimizationTips: analysis.optimizationTips,
    });
  }, [measurements, material]);

  useEffect(() => {
    calculateRoof();
  }, [calculateRoof]);

  const handleReset = useCallback(() => {
    setMeasurements({
      length: "",
      width: "",
      pitch: "30",
      roofType: "gable",
      floors: "1",
      materialThickness: "standard",
      ridgeType: "standard",
      gutterSize: "standard",
      budgetLevel: "medium",
    });
    setMaterial("asphalt");
    setResults({
      area: 0,
      materialCost: 0,
      laborCost: 0,
      totalCost: 0,
    });
    setDecisionTree({
      materialRecommendation: {
        recommendedMaterial: "asphalt",
        reason: "Enter measurements to get recommendations",
        isOptimal: true,
      },
      complexity: {
        score: 1,
        factors: [],
        level: "low",
      },
      optimizationTips: [],
    });
  }, []);

  const handleAutoOptimize = () => {
    // Only optimize if we have valid measurements
    if (!measurements.length || !measurements.width) {
      return;
    }

    const length = parseFloat(measurements.length);
    const width = parseFloat(measurements.width);
    const pitch = parseFloat(measurements.pitch) || 30;
    const area = length * width;

    // Calculate roof area with pitch factor
    const pitchFactor = 1 + Math.sin((pitch * Math.PI) / 180);
    const totalArea = area * pitchFactor;

    // Determine optimal settings to REDUCE complexity while maintaining quality
    const optimizations: Partial<Measurements> = {};
    let optimalMaterial = material; // Start with current material

    // 1. OPTIMIZE PITCH - Reduce complexity by avoiding extremes
    if (pitch < 10) {
      optimizations.pitch = "20"; // Better drainage, moderate complexity
    } else if (pitch > 45) {
      optimizations.pitch = "30"; // Reduce steepness, lower complexity
    }
    // Keep 15-45° as they're already optimal

    // 2. OPTIMIZE MATERIAL - Consider budget, area, and current selection
    const materialComplexity: Record<string, number> = {
      asphalt: 0,
      wood: 1,
      metal: 2,
      tile: 3,
      slate: 3,
    };

    const currentComplexity = materialComplexity[material] || 1;

    // Optimize based on budget level
    if (measurements.budgetLevel === "low") {
      // Low budget: Use lowest complexity material
      if (currentComplexity > 0) {
        optimalMaterial = "asphalt"; // Lowest complexity
      }
    } else if (measurements.budgetLevel === "medium") {
      // Medium budget: Use metal (good balance)
      if (currentComplexity > 2) {
        optimalMaterial = "metal"; // Reduce from tile/slate to metal
      }
    } else if (measurements.budgetLevel === "high") {
      // High budget: Can use premium materials, but optimize for large areas
      if (totalArea > 150) {
        // Large area: Metal is more cost-effective than tile/slate
        if (currentComplexity > 2) {
          optimalMaterial = "metal";
        }
      }
      // Small/medium areas: Keep current material if it's tile/slate
    }

    // 3. OPTIMIZE MATERIAL THICKNESS - Reduce complexity
    if (
      measurements.materialThickness === "premium" ||
      measurements.materialThickness === "heavy"
    ) {
      // Only keep premium/heavy if high budget and small area
      if (measurements.budgetLevel === "high" && totalArea < 100) {
        // Keep premium for small, high-budget projects
      } else {
        optimizations.materialThickness = "standard"; // Reduce complexity
      }
    }

    // 4. OPTIMIZE RIDGE TYPE - Reduce complexity
    const optimizedPitch = parseFloat(
      optimizations.pitch || measurements.pitch
    );
    if (optimizedPitch <= 30) {
      optimizations.ridgeType = "standard"; // Simpler installation for moderate pitches
    }
    // Only keep ventilated for steep roofs that stayed steep after optimization

    // 5. OPTIMIZE GUTTER SIZE - Only use large when necessary
    if (totalArea > 200) {
      optimizations.gutterSize = "large"; // Necessary for very large roofs
    } else if (totalArea <= 150) {
      optimizations.gutterSize = "standard"; // Reduce complexity for smaller roofs
    }
    // Keep current selection for medium roofs (150-200 sq.m)

    // Apply material optimization
    if (optimalMaterial !== material) {
      setMaterial(optimalMaterial);
    }

    // Apply measurement optimizations
    setMeasurements((prev) => ({
      ...prev,
      ...optimizations,
    }));
  };

  return {
    measurements,
    setMeasurements,
    material,
    setMaterial,
    results,
    decisionTree,
    calculateRoof,
    handleReset,
    handleAutoOptimize,
  };
}
