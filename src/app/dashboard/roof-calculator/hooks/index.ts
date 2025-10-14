"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "../types";
import { analyzeProject } from "@/lib/decision-tree";
import { materials } from "../components/material-selection";
import * as CONSTANTS from "../constants";
import { getSlopeMultiplier } from "../constants";
import { updatePricingConstants } from "../constants";
// Remove direct import of server-side function

export function useRoofCalculator() {
  const [measurements, setMeasurements] = useState<Measurements>({
    length: "",
    width: "",
    pitch: "30",
    roofType: "gable",
    floors: "1",
    materialThickness: "0.4",
    insulationType: "fiberglass-batt",
    ridgeType: "corrugated",
    gutterSize: "cut-16",
    gutterMaterial: "pre-painted-gi",
    budgetLevel: "low",
    budgetAmount: "",
    constructionMode: "new",
    gutterLengthA: "",
    gutterSlope: "",
    gutterLengthC: "",
    insulationThickness: "10mm",
    includeInsulation: false,
    ventilationType: "ridge-vent",
    ventilationPieces: "0",
    includeVentilation: false,
    screwType: "roofing-with-washer",
  });

  const [material, setMaterial] = useState("corrugated-0.4"); // Default material
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Auto-match ridge type with material selection
  useEffect(() => {
    // Extract base material name (e.g., "corrugated-0.4" -> "corrugated", "longspan-0.4" -> "longspan")
    const baseMaterial = material.split("-")[0];
    
    // Auto-match ridge for corrugated and long-span materials
    if (baseMaterial === "corrugated" || baseMaterial === "longspan") {
      setMeasurements((prev) => ({
        ...prev,
        ridgeType: "corrugated",
      }));
    }
  }, [material]);

  const [results, setResults] = useState<CalculationResults>({
    area: 0,
    materialCost: 0,
    gutterCost: 0,
    ridgeCost: 0,
    screwsCost: 0,
    insulationCost: 0,
    ventilationCost: 0,
    totalMaterialsCost: 0,
    laborCost: 0,
    removalCost: 0,
    totalCost: 0,
    gutterPieces: 0,
    ridgeLength: 0,
    materialQuantity: 0,
    screwsQuantity: 0,
  });

  // Initialize decision tree with current state
  const initialDecisionTree = analyzeProject({
    roofType: measurements.roofType,
    pitch: parseFloat(measurements.pitch) || 30,
    area: 0, // Will be updated when measurements are entered
    material: "corrugated", // Current material
    floors: parseFloat(measurements.floors) || 1,
    materialThickness: measurements.materialThickness,
    ridgeType: measurements.ridgeType,
    gutterSize: measurements.gutterSize,
    budgetLevel: measurements.budgetLevel,
  });

  const [decisionTree, setDecisionTree] =
    useState<DecisionTreeResult>(initialDecisionTree);

  // Load pricing from API on mount
  useEffect(() => {
    const loadPricing = async () => {
      try {
        setIsLoadingPricing(true);
        setPricingError(null);
        
        const response = await fetch('/api/pricing?constants=true');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          updatePricingConstants(result.data);
          console.log('✅ Pricing constants loaded successfully from API');
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('❌ Failed to load pricing from API, using fallback values:', error);
        setPricingError('Failed to load latest pricing. Using cached values.');
        // Continue with fallback values (already set in constants)
      } finally {
        setIsLoadingPricing(false);
      }
    };

    loadPricing();
  }, []);

  // Update decision tree when material or relevant measurements change
  useEffect(() => {
    const length = parseFloat(measurements.length) || 0;
    const width = parseFloat(measurements.width) || 0;
    const area = length * width;
    const floors = parseFloat(measurements.floors) || 1;

    const analysis = analyzeProject({
      roofType: measurements.roofType,
      pitch: parseFloat(measurements.pitch) || 30,
      area,
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
  }, [
    material,
    measurements.roofType,
    measurements.pitch,
    measurements.floors,
    measurements.materialThickness,
    measurements.ridgeType,
    measurements.gutterSize,
    measurements.budgetLevel,
    measurements.length,
    measurements.width,
  ]);

  // Auto-populate selections based on budget level and area
  useEffect(() => {
    const length = parseFloat(measurements.length) || 0;
    const width = parseFloat(measurements.width) || 0;
    const area = length * width;

    setMeasurements((prev) => {
      const isLow = prev.budgetLevel === "low";

      // Gutter size: cut-24 for very large areas, otherwise cut-16
      const nextGutterSize = area > 200 ? "cut-24" : "cut-16";

      // Ridge type: high budget prefers ventilated, low budget standard
      const nextRidgeType = isLow ? "standard" : "ventilated";

      // Screw type: basic for low budget, premium for high budget
      const nextScrew = isLow ? "roofing-with-washer" : "tek-screw";

      // Insulation: type + thickness vary by budget (only update if already included)
      const nextInsulationType = prev.includeInsulation
        ? (isLow ? "fiberglass-batt" : "spray-foam")
        : prev.insulationType;
      const nextInsulationThickness = prev.includeInsulation
        ? (isLow ? "10mm" : "20mm")
        : prev.insulationThickness;

      // Ventilation: default ridge vent; pieces based on area (only update if already included)
      const nextVentType = prev.includeVentilation ? "ridge-vent" : prev.ventilationType;
      const nextVentPieces = prev.includeVentilation && area > 0
        ? String(Math.max(0, Math.ceil(area / 50)))
        : prev.ventilationPieces;

      return {
        ...prev,
        gutterSize: nextGutterSize,
        ridgeType: nextRidgeType,
        screwType: nextScrew,
        insulationType: nextInsulationType,
        insulationThickness: nextInsulationThickness,
        ventilationType: nextVentType,
        ventilationPieces: nextVentPieces,
      };
    });
  }, [measurements.budgetLevel, measurements.length, measurements.width]);

  const calculateRoof = useCallback(() => {
    const length = parseFloat(measurements.length) || 0;
    const width = parseFloat(measurements.width) || 0;
    const pitch = parseFloat(measurements.pitch) || 0;

    if (length === 0 || width === 0) {
      setResults({
        area: 0,
        materialCost: 0,
        gutterCost: 0,
        ridgeCost: 0,
        screwsCost: 0,
        insulationCost: 0,
        ventilationCost: 0,
        totalMaterialsCost: 0,
        laborCost: 0,
        removalCost: 0,
        totalCost: 0,
        gutterPieces: 0,
        ridgeLength: 0,
        materialQuantity: 0,
        screwsQuantity: 0,
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

    // 1. Calculate plan area and apply slope multiplier derived from pitch
    const planArea = length * width;
    const slopeMultiplier = getSlopeMultiplier(pitch);
    
    // Apply gable roof adjustment: +5% for triangular shape (2 sides)
    // Shed roof stays the same (single straight slope)
    const gableAreaMultiplier = measurements.roofType === "gable" ? 1.05 : 1.0;
    const totalArea = planArea * slopeMultiplier * gableAreaMultiplier;

    // 2. Calculate roof material cost
    const selectedMaterial = materials.find((m) => m.value === material);
    const pricePerSqm = selectedMaterial?.price || CONSTANTS.MATERIAL_PRICES.corrugated;
    const materialCost = Math.round(totalArea * pricePerSqm);

    // 3. Calculate gutter cost
    // Formula: (A-Length + B-Slope + C-Length) × 2 ÷ 2.3 = pieces
    const gutterA = parseFloat(measurements.gutterLengthA) || 0;
    const gutterB = parseFloat(measurements.gutterSlope) || 0;
    const gutterC = parseFloat(measurements.gutterLengthC) || 0;
    const gutterPieces =
      gutterA + gutterB + gutterC > 0
        ? Math.ceil(
            ((gutterA + gutterB + gutterC) * 2) / CONSTANTS.GUTTER_DIVISOR
          )
        : 0;
    const gutterPricePerPiece =
      (CONSTANTS.GUTTER_PRICES as Record<string, number>)[measurements.gutterSize] || 350;
    const gutterCost = gutterPieces * gutterPricePerPiece;

    // 4. Calculate roof ridge cost
    // Quantity = Length (user input), auto-match material type
    const ridgeLength = length; // Ridge follows the length of the roof
    const ridgePricePerMeter =
      CONSTANTS.RIDGE_PRICES[material as keyof typeof CONSTANTS.RIDGE_PRICES] ||
      CONSTANTS.RIDGE_PRICES.corrugated;
    const ridgeCost = Math.round(ridgeLength * ridgePricePerMeter);

    // 5. Calculate screws cost and quantity
    const screwsPerSqm = 10; // Base screws per square meter
    const screwsQuantity = Math.ceil(totalArea * screwsPerSqm);
    
    // Get price per screw from selected screw type
    // For now, use fallback pricing until we implement dynamic loading
    const selectedScrewPrice = CONSTANTS.SCREW_TYPES[measurements.screwType as keyof typeof CONSTANTS.SCREW_TYPES]?.price || CONSTANTS.SCREW_TYPES["roofing-with-washer"].price;
    const screwsCost = Math.round(screwsQuantity * selectedScrewPrice);

    // 6. Calculate insulation cost (100% coverage) - only if included
    const insulationCost = measurements.includeInsulation
      ? (() => {
          const insulationPricePerSqm =
            CONSTANTS.INSULATION_PRICES[
              measurements.insulationThickness as keyof typeof CONSTANTS.INSULATION_PRICES
            ] || CONSTANTS.INSULATION_PRICES["10mm"];
          return Math.round(totalArea * insulationPricePerSqm);
        })()
      : 0;

    // 7. Calculate ventilation cost - only if included
    const ventilationCost = measurements.includeVentilation
      ? (() => {
          const ventilationPieces = parseFloat(measurements.ventilationPieces) || 0;
          return ventilationPieces * CONSTANTS.VENTILATION_PRICE_PER_PIECE;
        })()
      : 0;

    // 8. Calculate total materials cost
    const totalMaterialsCost =
      materialCost +
      gutterCost +
      ridgeCost +
      screwsCost +
      insulationCost +
      ventilationCost;

    // 9. Calculate labor cost based on construction mode
    const laborPercentage =
      measurements.constructionMode === "repair"
        ? CONSTANTS.LABOR_COST_REPAIR
        : CONSTANTS.LABOR_COST_NEW_CONSTRUCTION;
    const laborCost = Math.round(totalMaterialsCost * laborPercentage);

    // 10. Calculate removal cost for repairs (included in labor for repairs)
    const removalCost =
      measurements.constructionMode === "repair"
        ? Math.round(totalMaterialsCost * 0.1) // 10% removal cost
        : 0;

    // 11. Calculate total cost
    const totalCost = totalMaterialsCost + laborCost + removalCost;

    setResults({
      area: totalArea,
      materialCost,
      gutterCost,
      ridgeCost,
      screwsCost,
      insulationCost,
      ventilationCost,
      totalMaterialsCost,
      laborCost,
      removalCost,
      totalCost,
      gutterPieces,
      ridgeLength,
      materialQuantity: totalArea, // Material quantity is the same as area in sq.m
      screwsQuantity,
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
      materialThickness: "0.4",
      insulationType: "fiberglass-batt",
      ridgeType: "corrugated",
      gutterSize: "standard",
      budgetLevel: "low",
      budgetAmount: "",
      constructionMode: "new",
      gutterLengthA: "",
      gutterSlope: "",
      gutterLengthC: "",
      insulationThickness: "10mm",
      includeInsulation: false,
      ventilationType: "ridge-vent",
      ventilationPieces: "0",
      includeVentilation: false,
      screwType: "roofing-with-washer",
    });
    setMaterial("corrugated-0.4"); // Reset to default material
    setResults({
      area: 0,
      materialCost: 0,
      gutterCost: 0,
      ridgeCost: 0,
      screwsCost: 0,
      insulationCost: 0,
      ventilationCost: 0,
      totalMaterialsCost: 0,
      laborCost: 0,
      removalCost: 0,
      totalCost: 0,
      gutterPieces: 0,
      ridgeLength: 0,
      materialQuantity: 0,
      screwsQuantity: 0,
    });
    setDecisionTree({
      materialRecommendation: {
        recommendedMaterial: "corrugated",
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
      return { hasChanges: false, changesCount: 0 };
    }

    const length = parseFloat(measurements.length);
    const width = parseFloat(measurements.width);
    const pitch = parseFloat(measurements.pitch) || 30;
    const totalArea = length * width; // Simple area calculation

    // Track changes for optimization feedback
    let changesCount = 0;

    // Determine optimal settings to REDUCE complexity while maintaining quality
    const optimizations: Partial<Measurements> = {};
    let optimalMaterial = material; // Start with current material

    // 1. OPTIMIZE PITCH - Reduce complexity by avoiding extremes
    if (pitch < 10) {
      optimizations.pitch = "20"; // Better drainage, moderate complexity
      changesCount++;
    } else if (pitch > 45) {
      optimizations.pitch = "30"; // Reduce steepness, lower complexity
      changesCount++;
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
        changesCount++;
      }
    } else if (measurements.budgetLevel === "medium") {
      // Medium budget: Use metal (good balance)
      if (currentComplexity > 2) {
        optimalMaterial = "metal"; // Reduce from tile/slate to metal
        changesCount++;
      }
    } else if (measurements.budgetLevel === "high") {
      // High budget: Can use premium materials, but optimize for large areas
      if (totalArea > 150) {
        // Large area: Metal is more cost-effective than tile/slate
        if (currentComplexity > 2) {
          optimalMaterial = "metal";
          changesCount++;
        }
      }
      // Small/medium areas: Keep current material if it's tile/slate
    }

    // 3. OPTIMIZE RIDGE TYPE - Reduce complexity
    const optimizedPitch = parseFloat(
      optimizations.pitch || measurements.pitch
    );
    if (optimizedPitch <= 30) {
      optimizations.ridgeType = "standard"; // Simpler installation for moderate pitches
      changesCount++;
    }
    // Only keep ventilated for steep roofs that stayed steep after optimization

    // 5. OPTIMIZE GUTTER SIZE - Only use cut-24 when necessary
    if (totalArea > 200) {
      optimizations.gutterSize = "cut-24"; // Necessary for very large roofs
      changesCount++;
    } else if (totalArea <= 150) {
      optimizations.gutterSize = "cut-16"; // Reduce complexity for smaller roofs
      changesCount++;
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

    return { hasChanges: changesCount > 0, changesCount };
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
    isLoadingPricing,
    pricingError,
  };
}
