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
    materialThickness: "standard",
    ridgeType: "standard",
    gutterSize: "standard",
    budgetLevel: "low",
    budgetAmount: "",
    constructionMode: "new",
    gutterLengthA: "",
    gutterSlope: "",
    gutterLengthC: "",
    insulationThickness: "10mm",
    ventilationPieces: "0",
  });

  const [material, setMaterial] = useState("asphalt");
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

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
    material: "asphalt", // Current material
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
    const totalArea = planArea * slopeMultiplier;

    // 2. Calculate roof material cost
    const selectedMaterial = materials.find((m) => m.value === material);
    const pricePerSqm =
      selectedMaterial?.price || CONSTANTS.MATERIAL_PRICES.asphalt;
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
      measurements.gutterSize === "large"
        ? CONSTANTS.GUTTER_PRICES.large
        : CONSTANTS.GUTTER_PRICES.standard;
    const gutterCost = gutterPieces * gutterPricePerPiece;

    // 4. Calculate roof ridge cost
    // Quantity = Length (user input), auto-match material type
    const ridgeLength = length; // Ridge follows the length of the roof
    const ridgePricePerMeter =
      CONSTANTS.RIDGE_PRICES[material as keyof typeof CONSTANTS.RIDGE_PRICES] ||
      CONSTANTS.RIDGE_PRICES.asphalt;
    const ridgeCost = Math.round(ridgeLength * ridgePricePerMeter);

    // 5. Calculate screws cost and quantity
    const screwsPricePerSqm =
      CONSTANTS.SCREWS_PRICE_PER_SQM[
        material as keyof typeof CONSTANTS.SCREWS_PRICE_PER_SQM
      ] || CONSTANTS.SCREWS_PRICE_PER_SQM.asphalt;
    const screwsCost = Math.round(totalArea * screwsPricePerSqm);
    
    // Calculate screws quantity (assuming ~10 screws per sq.m for most materials)
    const screwsPerSqm = 10; // Base screws per square meter
    const screwsQuantity = Math.ceil(totalArea * screwsPerSqm);

    // 6. Calculate insulation cost (100% coverage)
    const insulationPricePerSqm =
      CONSTANTS.INSULATION_PRICES[
        measurements.insulationThickness as keyof typeof CONSTANTS.INSULATION_PRICES
      ] || CONSTANTS.INSULATION_PRICES["10mm"];
    const insulationCost = Math.round(totalArea * insulationPricePerSqm);

    // 7. Calculate ventilation cost
    const ventilationPieces = parseFloat(measurements.ventilationPieces) || 0;
    const ventilationCost =
      ventilationPieces * CONSTANTS.VENTILATION_PRICE_PER_PIECE;

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
      materialThickness: "standard",
      ridgeType: "standard",
      gutterSize: "standard",
      budgetLevel: "medium",
      budgetAmount: "",
      constructionMode: "new",
      gutterLengthA: "",
      gutterSlope: "",
      gutterLengthC: "",
      insulationThickness: "10mm",
      ventilationPieces: "0",
    });
    setMaterial("asphalt");
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
        changesCount++;
      }
    }

    // 4. OPTIMIZE RIDGE TYPE - Reduce complexity
    const optimizedPitch = parseFloat(
      optimizations.pitch || measurements.pitch
    );
    if (optimizedPitch <= 30) {
      optimizations.ridgeType = "standard"; // Simpler installation for moderate pitches
      changesCount++;
    }
    // Only keep ventilated for steep roofs that stayed steep after optimization

    // 5. OPTIMIZE GUTTER SIZE - Only use large when necessary
    if (totalArea > 200) {
      optimizations.gutterSize = "large"; // Necessary for very large roofs
      changesCount++;
    } else if (totalArea <= 150) {
      optimizations.gutterSize = "standard"; // Reduce complexity for smaller roofs
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
