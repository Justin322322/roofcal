"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "../types";
import { analyzeProject } from "@/lib/decision-tree";
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
    gutterSize: "standard",
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

  const [material, setMaterial] = useState(""); // require explicit selection
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [isPricingLoaded, setIsPricingLoaded] = useState(false);

  // Auto-match ridge type with material selection
  useEffect(() => {
    // Extract base material name (e.g., "corrugated-0.4" -> "corrugated", "longspan-0.4" -> "longspan")
    const baseMaterial = material.split("-")[0];
    
    // Auto-match ridge for corrugated and long-span materials
    if (baseMaterial === "corrugated" || baseMaterial === "longspan") {
      setMeasurements((prev) => ({
        ...prev,
        ridgeType: baseMaterial === "longspan" ? "longspan" : "corrugated",
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
          console.log('Pricing constants loaded successfully from API');
          setIsPricingLoaded(true);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Failed to load pricing from API:', error);
        setPricingError('Failed to load latest pricing.');
        setIsPricingLoaded(false);
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
    // Block calculations until pricing has loaded and selections are valid
    if (!isPricingLoaded || !material) {
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
      return;
    }
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

    // 2. Calculate roof material cost (from DB-backed constants)
    const pricePerSqm = (CONSTANTS.MATERIAL_PRICES as Record<string, number>)[material] || 0;
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
      (CONSTANTS.GUTTER_PRICES as Record<string, number>)[measurements.gutterSize] || 0;
    const gutterCost = gutterPieces * gutterPricePerPiece;

    // 4. Calculate roof ridge cost
    // Quantity = Length (user input), auto-match material type
    const ridgeLength = length; // Ridge follows the length of the roof
    // Price ridge by selected ridge type (fallback to corrugated)
    const ridgePricePerMeter =
      CONSTANTS.RIDGE_PRICES[
        (measurements.ridgeType as keyof typeof CONSTANTS.RIDGE_PRICES) ||
          "corrugated"
      ] || CONSTANTS.RIDGE_PRICES.corrugated;
    const ridgeCost = Math.round(ridgeLength * ridgePricePerMeter);

    // 5. Calculate screws cost and quantity
    const screwsPerSqm = 10; // Base screws per square meter
    const screwsQuantity = Math.ceil(totalArea * screwsPerSqm);
    
    // Use per-sqm screws pricing by base material from DB constants
    const baseMaterial = material.split('-')[0];
    const screwsPricePerSqm = (CONSTANTS.SCREWS_PRICE_PER_SQM as Record<string, number>)[baseMaterial] || 0;
    const screwsCost = Math.round(totalArea * screwsPricePerSqm);

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

    // 10. Removal cost no longer applied
    const removalCost = 0;

    // 11. Calculate total cost (without removal cost)
    const totalCost = totalMaterialsCost + laborCost;

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
      optimizationTips: analysis.optimizationTips,
    });
  }, [measurements, material, isPricingLoaded]);

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
    setMaterial(""); // require explicit selection after reset
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
      optimizationTips: [],
    });
  }, []);

  const handleAutoOptimize = () => {
    // Only optimize if we have valid measurements
    if (!measurements.length || !measurements.width) {
      return { 
        hasChanges: false, 
        changesCount: 0, 
        changes: [],
        totalSavings: 0,
        performanceImprovements: []
      };
    }

    const length = parseFloat(measurements.length);
    const width = parseFloat(measurements.width);
    const pitch = parseFloat(measurements.pitch) || 30;
    const totalArea = length * width; // Simple area calculation

    // Track changes for optimization feedback
    const changes: Array<{
      field: string;
      fieldLabel: string;
      beforeValue: string | number;
      afterValue: string | number;
      reason: string;
      impact: 'cost' | 'performance' | 'efficiency' | 'complexity';
      savings?: number;
    }> = [];
    let totalSavings = 0;

    // Determine optimal settings to REDUCE complexity while maintaining quality
    const optimizations: Partial<Measurements> = {};
    let optimalMaterial = material; // Start with current material

    // 1. OPTIMIZE PITCH - Reduce complexity by avoiding extremes
    if (pitch < 10) {
      optimizations.pitch = "20"; // Better drainage, moderate complexity
      changes.push({
        field: 'pitch',
        fieldLabel: 'Roof Pitch',
        beforeValue: `${pitch}°`,
        afterValue: '20°',
        reason: 'Improved drainage and reduced installation complexity while maintaining structural integrity',
        impact: 'complexity'
      });
    } else if (pitch > 45) {
      optimizations.pitch = "30"; // Reduce steepness, lower complexity
      changes.push({
        field: 'pitch',
        fieldLabel: 'Roof Pitch',
        beforeValue: `${pitch}°`,
        afterValue: '30°',
        reason: 'Reduced steepness to lower installation complexity and safety requirements',
        impact: 'complexity'
      });
    }

    // 2. OPTIMIZE MATERIAL - Consider budget, area, and current selection
    const materialComplexity: Record<string, number> = {
      asphalt: 0,
      wood: 1,
      metal: 2,
      tile: 3,
      slate: 3,
    };

    const materialLabels: Record<string, string> = {
      asphalt: 'Asphalt Shingles',
      wood: 'Wood Shingles',
      metal: 'Metal Roofing',
      tile: 'Clay Tiles',
      slate: 'Slate Tiles',
    };

    const currentComplexity = materialComplexity[material] || 1;

    // Optimize based on budget level
    if (measurements.budgetLevel === "low") {
      // Low budget: Use lowest complexity material
      if (currentComplexity > 0) {
        optimalMaterial = "asphalt"; // Lowest complexity
        changes.push({
          field: 'material',
          fieldLabel: 'Roofing Material',
          beforeValue: materialLabels[material] || material,
          afterValue: materialLabels.asphalt,
          reason: 'Switched to more cost-effective material while maintaining quality for low budget projects',
          impact: 'cost',
          savings: Math.round(totalArea * 50) // Estimated savings per sq.m
        });
        totalSavings += Math.round(totalArea * 50);
      }
    } else if (measurements.budgetLevel === "medium") {
      // Medium budget: Use metal (good balance)
      if (currentComplexity > 2) {
        optimalMaterial = "metal"; // Reduce from tile/slate to metal
        changes.push({
          field: 'material',
          fieldLabel: 'Roofing Material',
          beforeValue: materialLabels[material] || material,
          afterValue: materialLabels.metal,
          reason: 'Switched to metal roofing for better cost-effectiveness and durability on medium budget',
          impact: 'cost',
          savings: Math.round(totalArea * 80)
        });
        totalSavings += Math.round(totalArea * 80);
      }
    } else if (measurements.budgetLevel === "high") {
      // High budget: Can use premium materials, but optimize for large areas
      if (totalArea > 150) {
        // Large area: Metal is more cost-effective than tile/slate
        if (currentComplexity > 2) {
          optimalMaterial = "metal";
          changes.push({
            field: 'material',
            fieldLabel: 'Roofing Material',
            beforeValue: materialLabels[material] || material,
            afterValue: materialLabels.metal,
            reason: 'Optimized for large area installation - metal provides better cost-effectiveness for projects over 150 sq.m',
            impact: 'cost',
            savings: Math.round(totalArea * 120)
          });
          totalSavings += Math.round(totalArea * 120);
        }
      }
    }

    // 3. OPTIMIZE RIDGE TYPE - Reduce complexity
    const optimizedPitch = parseFloat(
      optimizations.pitch || measurements.pitch
    );
    if (optimizedPitch <= 30 && measurements.ridgeType !== "standard") {
      optimizations.ridgeType = "standard"; // Simpler installation for moderate pitches
      changes.push({
        field: 'ridgeType',
        fieldLabel: 'Ridge Type',
        beforeValue: measurements.ridgeType === "ventilated" ? "Ventilated Ridge" : "Standard Ridge",
        afterValue: "Standard Ridge",
        reason: 'Simplified ridge type for moderate pitch angles to reduce installation complexity',
        impact: 'complexity'
      });
    }

    // 4. OPTIMIZE GUTTER SIZE - Only use cut-24 when necessary
    if (totalArea > 200 && measurements.gutterSize !== "cut-24") {
      optimizations.gutterSize = "cut-24"; // Necessary for very large roofs
      changes.push({
        field: 'gutterSize',
        fieldLabel: 'Gutter Size',
        beforeValue: measurements.gutterSize === "cut-16" ? "16-inch Gutter" : "Standard Gutter",
        afterValue: "24-inch Gutter",
        reason: 'Upgraded to larger gutter capacity for better water management on large roof areas',
        impact: 'performance'
      });
    } else if (totalArea <= 150 && measurements.gutterSize !== "cut-16") {
      optimizations.gutterSize = "cut-16"; // Reduce complexity for smaller roofs
      changes.push({
        field: 'gutterSize',
        fieldLabel: 'Gutter Size',
        beforeValue: measurements.gutterSize === "cut-24" ? "24-inch Gutter" : "Standard Gutter",
        afterValue: "16-inch Gutter",
        reason: 'Optimized gutter size for smaller roof area to reduce material costs',
        impact: 'cost',
        savings: Math.round(totalArea * 2) // Estimated savings
      });
      totalSavings += Math.round(totalArea * 2);
    }

    // 5. OPTIMIZE INSULATION - Reduce thickness for small areas
    if (totalArea < 100 && measurements.includeInsulation && measurements.insulationThickness !== "10mm") {
      optimizations.insulationThickness = "10mm";
      changes.push({
        field: 'insulationThickness',
        fieldLabel: 'Insulation Thickness',
        beforeValue: measurements.insulationThickness,
        afterValue: "10mm",
        reason: 'Reduced insulation thickness for small areas to optimize costs while maintaining thermal performance',
        impact: 'cost',
        savings: Math.round(totalArea * 8)
      });
      totalSavings += Math.round(totalArea * 8);
    }

    // Apply material optimization
    if (optimalMaterial !== material) {
      setMaterial(optimalMaterial);
    }

    // Apply measurement optimizations
    setMeasurements((prev) => ({
      ...prev,
      ...optimizations,
    }));

    // Generate performance improvements summary
    const performanceImprovements: string[] = [];
    if (changes.some(c => c.impact === 'complexity')) {
      performanceImprovements.push('Reduced installation complexity');
    }
    if (changes.some(c => c.impact === 'performance')) {
      performanceImprovements.push('Enhanced roof performance');
    }
    if (changes.some(c => c.impact === 'efficiency')) {
      performanceImprovements.push('Improved material efficiency');
    }
    if (totalSavings > 0) {
      performanceImprovements.push('Reduced overall project costs');
    }

    return { 
      hasChanges: changes.length > 0, 
      changesCount: changes.length,
      changes,
      totalSavings,
      performanceImprovements
    };
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
    isPricingLoaded,
  };
}
