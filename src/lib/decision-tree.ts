/**
 * Decision Tree Algorithm for Roof Cost Estimation
 * Provides intelligent material recommendations, complexity scoring, and optimization tips
 */

export interface MaterialRecommendation {
  recommendedMaterial: string;
  reason: string;
  isOptimal: boolean;
}

export interface ComplexityScore {
  score: number; // 1-10 scale
  factors: string[];
  level: "low" | "medium" | "high";
}

export interface DecisionTreeInput {
  roofType: string;
  pitch: number;
  area: number;
  material: string;
  floors: number;
  materialThickness: string;
  ridgeType: string;
  gutterSize: string;
  budgetLevel: string;
}

/**
 * Analyzes project parameters and recommends optimal roofing material
 */
export function analyzeMaterialRecommendation(
  input: DecisionTreeInput
): MaterialRecommendation {
  const { roofType, pitch, area, material, budgetLevel, materialThickness } =
    input;

  // Decision Node 1: Budget-based recommendations
  if (budgetLevel === "low") {
    if (material === "slate" || material === "tile") {
      return {
        recommendedMaterial: "asphalt",
        reason:
          "Budget-friendly option with good performance (15-30 year lifespan)",
        isOptimal: false,
      };
    }
    if (materialThickness === "premium" || materialThickness === "heavy") {
      return {
        recommendedMaterial: material,
        reason:
          "Consider standard thickness to reduce costs while maintaining quality",
        isOptimal: false,
      };
    }
  }

  // Decision Node 2: Flat roof with low pitch requires better drainage
  if (roofType === "flat" && pitch < 10) {
    return {
      recommendedMaterial: "metal",
      reason: "Better drainage for flat roofs, prevents water pooling",
      isOptimal: material === "metal",
    };
  }

  // Decision Node 3: Steep pitch for heavy rain areas
  if (pitch > 45) {
    return {
      recommendedMaterial: "metal",
      reason:
        "Excellent for steep slopes - durable, fast drainage, ideal for heavy rain areas",
      isOptimal: material === "metal",
    };
  }

  // Decision Node 4: Moderate pitch (15-30°) - good for most climates
  if (pitch >= 15 && pitch <= 30) {
    if (budgetLevel === "high" && material === "asphalt") {
      return {
        recommendedMaterial: "metal",
        reason:
          "30° pitch excellent for heavy rain - metal offers superior longevity",
        isOptimal: false,
      };
    }
    return {
      recommendedMaterial: material,
      reason: "Good pitch for heavy rain areas - ensures proper water runoff",
      isOptimal: true,
    };
  }

  // Decision Node 5: Large area with expensive materials - suggest alternatives
  if (
    area > 150 &&
    (material === "slate" || material === "tile") &&
    budgetLevel !== "high"
  ) {
    return {
      recommendedMaterial: "metal",
      reason:
        "More cost-effective for large areas with similar longevity (40-70 years)",
      isOptimal: false,
    };
  }

  // Decision Node 6: High budget - premium materials
  if (
    budgetLevel === "high" &&
    (material === "asphalt" || material === "wood")
  ) {
    return {
      recommendedMaterial: "tile",
      reason:
        "Consider premium materials for better longevity and property value",
      isOptimal: false,
    };
  }

  // Default: Current selection is acceptable
  return {
    recommendedMaterial: material,
    reason: "Suitable for your project specifications and budget",
    isOptimal: true,
  };
}

/**
 * Calculates project complexity score (1-10) based on multiple factors
 */
export function calculateComplexityScore(
  input: DecisionTreeInput
): ComplexityScore {
  const {
    roofType,
    pitch,
    area,
    material,
    floors,
    materialThickness,
    ridgeType,
    gutterSize,
  } = input;
  let score = 1;
  const factors: string[] = [];

  // Factor 1: Pitch complexity (0-3 points)
  if (pitch >= 45) {
    score += 3;
    factors.push("Very steep pitch");
  } else if (pitch >= 30) {
    score += 2;
    factors.push("Steep pitch");
  } else if (pitch >= 15) {
    score += 1;
  }

  // Factor 2: Roof type complexity (0-2 points)
  const typeScores: Record<string, number> = {
    shed: 0,
    gable: 1,
  };
  const typeScore = typeScores[roofType] || 1;
  score += typeScore;

  if (roofType === "gable") {
    factors.push("Gable roof (+5% cost)");
  }

  // Factor 3: Area complexity (1-3 points)
  if (area > 200) {
    score += 3;
    factors.push("Large roof area");
  } else if (area > 100) {
    score += 2;
    factors.push("Medium roof area");
  } else {
    score += 1;
  }

  // Factor 4: Material complexity (0-3 points)
  const matScores: Record<string, number> = {
    asphalt: 0,
    wood: 1,
    metal: 2,
    tile: 3,
    slate: 3,
  };
  const matScore = matScores[material] || 1;
  score += matScore;

  if (material === "slate" || material === "tile") {
    factors.push(`Premium ${material} material`);
  }

  // Factor 5: Building height complexity (0-2 points)
  if (floors >= 3) {
    score += 2;
    factors.push(`Multi-story building (${floors} floors)`);
  } else if (floors === 2) {
    score += 1;
    factors.push("Two-story building");
  }

  // Factor 6: Material thickness complexity (0-1 point)
  if (materialThickness === "premium" || materialThickness === "heavy") {
    score += 1;
    factors.push("Premium/heavy material thickness");
  }

  // Factor 7: Ridge and gutter specifications (0-1 point)
  if (ridgeType === "ventilated" || gutterSize === "large") {
    score += 1;
    if (ridgeType === "ventilated") factors.push("Ventilated ridge system");
  }

  // Normalize score to 1-10 range
  const finalScore = Math.min(Math.max(score, 1), 10);

  // Determine complexity level
  let level: "low" | "medium" | "high";
  if (finalScore <= 3) {
    level = "low";
  } else if (finalScore <= 6) {
    level = "medium";
  } else {
    level = "high";
  }

  return {
    score: finalScore,
    factors,
    level,
  };
}

/**
 * Generates actionable cost optimization tips based on project analysis
 */
export function generateOptimizationTips(
  input: DecisionTreeInput,
  complexity: ComplexityScore
): string[] {
  const {
    pitch,
    area,
    material,
    floors,
    materialThickness,
    ridgeType,
    gutterSize,
    budgetLevel,
  } = input;
  const tips: string[] = [];

  // Tip 1: High complexity projects
  if (complexity.score > 7) {
    tips.push(
      "Consider a phased approach to reduce upfront costs and manage complexity"
    );
  }

  // Tip 2: Steep pitch warning
  if (pitch > 45) {
    tips.push(
      "Steep pitch may increase labor costs by 20-30% due to safety requirements"
    );
  }

  // Tip 3: Low pitch waterproofing
  if (pitch < 15) {
    tips.push(
      "Low pitch requires enhanced waterproofing - budget an additional 15% for underlayment"
    );
  }

  // Tip 4: Large area with expensive materials
  if (area > 150 && (material === "slate" || material === "tile")) {
    tips.push(
      "Consider metal roofing for large areas - similar durability with lower material and labor costs"
    );
  }

  // Tip 5: Medium complexity optimization
  if (complexity.score >= 4 && complexity.score <= 6) {
    tips.push(
      "Project has moderate complexity - ensure contractor has relevant experience"
    );
  }

  // Tip 6: Material waste buffer (always included)
  tips.push("Add 10% material buffer for waste, cuts, and future repairs");

  // Tip 7: Additional for very large projects
  if (area > 200) {
    tips.push(
      "Large roof area - consider bulk pricing discounts when ordering materials"
    );
  }

  // Tip 8: Multi-story considerations
  if (floors >= 3) {
    tips.push(
      "Multi-story building requires additional safety measures and equipment - budget 15-25% extra for labor"
    );
  } else if (floors === 2) {
    tips.push(
      "Two-story building may require scaffolding - add 10% to labor costs"
    );
  }

  // Tip 9: Pitch-based climate recommendations
  if (pitch >= 15 && pitch <= 30) {
    tips.push(
      "Your roof pitch (15-30°) is optimal for heavy rain areas - ensures excellent water runoff"
    );
  } else if (pitch < 15) {
    tips.push(
      "Low pitch (<15°) may cause water pooling - ensure proper waterproofing and drainage systems"
    );
  } else if (pitch > 45) {
    tips.push(
      "Steep pitch (>45°) excellent for heavy rain but increases installation difficulty and costs"
    );
  }

  // Tip 10: Material thickness recommendations
  if (materialThickness === "standard" && budgetLevel === "high") {
    tips.push(
      "Consider upgrading to premium thickness for better durability and longer lifespan"
    );
  } else if (materialThickness === "premium" && budgetLevel === "low") {
    tips.push(
      "Standard thickness may reduce costs while still providing good protection"
    );
  }

  // Tip 11: Ridge and gutter optimization
  if (ridgeType === "standard" && pitch > 30) {
    tips.push(
      "Consider ventilated ridge caps for better attic ventilation and moisture control"
    );
  }

  if (gutterSize === "standard" && area > 150) {
    tips.push(
      "Large gutters recommended for big roofs to handle heavy rainfall effectively"
    );
  }

  // Tip 12: Budget-specific advice
  if (budgetLevel === "low" && (material === "slate" || material === "tile")) {
    tips.push(
      "Premium materials exceed budget level - consider metal or asphalt for cost savings"
    );
  }

  return tips;
}

/**
 * Complete decision tree analysis combining all three branches
 */
export function analyzeProject(input: DecisionTreeInput) {
  const materialRecommendation = analyzeMaterialRecommendation(input);
  const complexity = calculateComplexityScore(input);
  const optimizationTips = generateOptimizationTips(input, complexity);

  return {
    materialRecommendation,
    complexity,
    optimizationTips,
  };
}
