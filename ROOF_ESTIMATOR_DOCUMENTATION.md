# Roof Estimator Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Features](#core-features)
4. [Calculation Formulas](#calculation-formulas)
5. [Decision Tree Algorithm](#decision-tree-algorithm)
6. [Optimization Process](#optimization-process)
7. [User Interface Components](#user-interface-components)
8. [Technical Implementation](#technical-implementation)
9. [Usage Guide](#usage-guide)

---

## Overview

The **RoofCalc Roof Estimator** is an intelligent roofing cost estimation system designed for residential construction projects. It uses a decision tree algorithm to provide accurate cost estimates, complexity analysis, and optimization recommendations based on project specifications.

### Key Capabilities

- Real-time cost calculations with material and labor breakdown
- Intelligent material recommendations based on project parameters
- Complexity scoring (1-10 scale) with detailed factor analysis
- Smart optimization to reduce complexity while maintaining quality
- Climate-aware recommendations (optimized for heavy rain areas)
- Budget-conscious material selection

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                      │
│  (Measurements, Material Selection, Specifications)  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              useRoofCalculator Hook                  │
│  (State Management & Calculation Orchestration)      │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────────┐
│  Cost Calculator │      │  Decision Tree Logic │
│  (Area, Materials│      │  (Recommendations &  │
│   Labor Costs)   │      │   Optimization)      │
└──────────────────┘      └──────────────────────┘
        │                           │
        └─────────────┬─────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│              Results Display                         │
│  (Stats Cards, Calculations, Insights, Tips)        │
└─────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. **Measurement Input**

- **Roof Length** (meters): Length of the roof
- **Roof Width** (meters): Width of the roof
- **Roof Pitch** (degrees): Slope angle with climate recommendations
  - 5°-10°: Flat/low slope (requires excellent drainage)
  - 15°-30°: **Optimal for heavy rain areas**
  - 35°-40°: Excellent water runoff
  - 45°-60°: Very steep (high installation complexity)
- **Roof Type**: Gable, Hip, Flat, Mansard, Gambrel
- **Number of Floors**: 1-10 floors (affects complexity and labor costs)

### 2. **Material Selection**

Six roofing materials with different complexity levels:

- **Asphalt Shingles** (₱350/sq.m) - Complexity: 0 - Most economical
- **Wood Shakes** (₱500/sq.m) - Complexity: 1
- **Metal Roofing** (₱750/sq.m) - Complexity: 2 - Best balance
- **Clay Tiles** (₱1,200/sq.m) - Complexity: 3 - Premium
- **Slate** (₱2,000/sq.m) - Complexity: 3 - Premium

### 3. **Additional Specifications**

- **Budget Level**: Low / Medium / High
- **Material Thickness**: Standard / Premium / Heavy Duty
- **Ridge Type**: Standard / Ventilated Ridge Cap
- **Gutter Size**: Standard (5") / Large (6")

---

## Calculation Formulas

### 1. **Roof Area Calculation**

```javascript
// Base area
baseArea = length × width

// Pitch factor (accounts for slope)
pitchFactor = 1 + sin(pitch × π / 180)

// Total roof area
totalArea = baseArea × pitchFactor
```

**Example:**

- Length: 10m, Width: 8m, Pitch: 30°
- Base Area: 10 × 8 = 80 sq.m
- Pitch Factor: 1 + sin(30° × π/180) = 1.5
- Total Area: 80 × 1.5 = **120 sq.m**

### 2. **Material Cost Calculation**

```javascript
materialCost = totalArea × materialPricePerSqm
```

**Example:**

- Total Area: 120 sq.m
- Material: Metal Roofing (₱750/sq.m)
- Material Cost: 120 × 750 = **₱90,000**

### 3. **Labor Cost Calculation**

```javascript
// Base labor cost (30% of material cost)
baseLaborCost = materialCost × 0.30

// Adjustments based on complexity factors
if (floors === 2) {
  baseLaborCost × 1.10  // +10% for two-story
} else if (floors >= 3) {
  baseLaborCost × 1.20  // +20% for multi-story
}

// Additional adjustments
if (pitch > 45) {
  baseLaborCost × 1.15  // +15% for very steep roofs
}
```

**Example:**

- Material Cost: ₱90,000
- Base Labor: ₱90,000 × 0.30 = ₱27,000
- Two-story building: ₱27,000 × 1.10 = **₱29,700**

### 4. **Total Cost**

```javascript
totalCost = materialCost + laborCost;
```

**Example:**

- Material: ₱90,000
- Labor: ₱29,700
- Total: **₱119,700**

---

## Decision Tree Algorithm

The system uses a three-branch decision tree for intelligent analysis:

### Branch 1: Material Recommendation

```
START
  │
  ├─ Budget Level = Low?
  │   ├─ Yes → Recommend: Asphalt Shingles
  │   └─ No → Continue
  │
  ├─ Roof Type = Flat AND Pitch < 10°?
  │   ├─ Yes → Recommend: Metal (better drainage)
  │   └─ No → Continue
  │
  ├─ Pitch > 45°?
  │   ├─ Yes → Recommend: Metal (steep slope durability)
  │   └─ No → Continue
  │
  ├─ Pitch 15-30° (optimal rain)?
  │   ├─ Yes → Current material is good
  │   └─ No → Continue
  │
  ├─ Area > 150 sq.m AND Material = Premium?
  │   ├─ Yes AND Budget ≠ High → Recommend: Metal (cost-effective)
  │   └─ No → Continue
  │
  └─ Budget = High AND Material = Basic?
      ├─ Yes → Recommend: Premium materials
      └─ No → Current selection is optimal
```

### Branch 2: Complexity Scoring

The complexity score (1-10) is calculated based on multiple factors:

```javascript
score = 1; // Base score

// Factor 1: Pitch Complexity (0-3 points)
if (pitch >= 45)
  score += 3; // Very steep
else if (pitch >= 30)
  score += 2; // Steep
else if (pitch < 10) score += 2; // Too flat

// Factor 2: Roof Type Complexity (0-3 points)
roofTypeScores = {
  flat: 1,
  gable: 0,
  hip: 2,
  mansard: 3,
  gambrel: 3,
};
score += roofTypeScores[roofType];

// Factor 3: Area Complexity (1-3 points)
if (area > 200)
  score += 3; // Very large
else if (area > 150)
  score += 2; // Large
else score += 1; // Standard

// Factor 4: Material Complexity (0-3 points)
materialComplexity = {
  asphalt: 0,
  wood: 1,
  metal: 2,
  tile: 3,
  slate: 3,
};
score += materialComplexity[material];

// Factor 5: Building Height (0-2 points)
if (floors >= 3)
  score += 2; // Multi-story
else if (floors === 2) score += 1; // Two-story

// Factor 6: Material Thickness (0-1 point)
if (thickness === "premium" || thickness === "heavy") {
  score += 1;
}

// Factor 7: Ridge & Gutter Specs (0-1 point)
if (ridgeType === "ventilated" || gutterSize === "large") {
  score += 1;
}

// Normalize to 1-10 scale
finalScore = min(max(score, 1), 10);

// Determine level
if (score <= 3) level = "low";
else if (score <= 6) level = "medium";
else level = "high";
```

**Complexity Score Interpretation:**

- **1-3 (Low)**: Simple project, standard installation
- **4-6 (Medium)**: Moderate complexity, experienced contractor recommended
- **7-10 (High)**: Complex project, requires specialized expertise

### Branch 3: Optimization Tips

The system generates context-aware optimization tips:

```javascript
tips = [];

// High complexity projects
if (complexityScore > 7) {
  tips.push("Consider phased approach to manage complexity");
}

// Pitch optimization
if (pitch < 15) {
  tips.push("Low pitch may cause water pooling - ensure proper waterproofing");
} else if (pitch >= 15 && pitch <= 30) {
  tips.push("Your roof pitch is optimal for heavy rain areas");
} else if (pitch > 45) {
  tips.push(
    "Steep pitch excellent for heavy rain but increases installation difficulty"
  );
}

// Material-budget alignment
if (budgetLevel === "low" && (material === "slate" || material === "tile")) {
  tips.push(
    "Premium materials exceed budget level - consider metal or asphalt"
  );
}

// Multi-story considerations
if (floors >= 3) {
  tips.push(
    "Multi-story building requires additional safety measures - budget 15-25% extra for labor"
  );
} else if (floors === 2) {
  tips.push(
    "Two-story building may require scaffolding - add 10% to labor costs"
  );
}

// Ridge and gutter optimization
if (ridgeType === "standard" && pitch > 30) {
  tips.push("Consider ventilated ridge caps for better attic ventilation");
}

if (gutterSize === "standard" && area > 150) {
  tips.push("Large gutters recommended for big roofs to handle heavy rainfall");
}

// Always include waste buffer
tips.push("Add 10% material buffer for waste, cuts, and future repairs");
```

---

## Optimization Process

The **Optimize** button applies intelligent optimization to reduce complexity while maintaining quality:

### Optimization Algorithm

```javascript
function optimizeProject(currentState) {
  optimizations = {}

  // Step 1: Optimize Pitch
  if (pitch < 10) {
    optimizations.pitch = 20°  // Better drainage, moderate complexity
  } else if (pitch > 45) {
    optimizations.pitch = 30°  // Perfect for rain, lower complexity
  }

  // Step 2: Optimize Material (considers budget & area)
  if (budgetLevel === "low") {
    // Use lowest complexity material
    if (materialComplexity > 0) {
      optimizations.material = "asphalt"
      optimizations.thickness = "standard"
    }
  } else if (budgetLevel === "medium") {
    // Use metal for good balance
    if (materialComplexity > 2) {
      optimizations.material = "metal"
      optimizations.thickness = "standard"
    }
  } else if (budgetLevel === "high") {
    // For large areas, metal is more cost-effective than tile/slate
    if (area > 150 && materialComplexity > 2) {
      optimizations.material = "metal"
    }
    optimizations.thickness = "standard"  // Avoid premium complexity
  }

  // Step 3: Optimize Material Thickness
  if (thickness === "premium" || thickness === "heavy") {
    // Only keep premium for small, high-budget projects
    if (!(budgetLevel === "high" && area < 100)) {
      optimizations.thickness = "standard"
    }
  }

  // Step 4: Optimize Ridge Type
  optimizedPitch = optimizations.pitch || currentPitch
  if (optimizedPitch <= 30) {
    optimizations.ridgeType = "standard"  // Simpler installation
  }

  // Step 5: Optimize Gutter Size
  if (area > 200) {
    optimizations.gutterSize = "large"   // Necessary for very large roofs
  } else if (area <= 150) {
    optimizations.gutterSize = "standard" // Reduce complexity
  }

  return optimizations
}
```

### Optimization Results

**Example: High Complexity Project**

```
Before Optimization:
- Pitch: 50° (very steep)
- Material: Slate (complexity 3)
- Thickness: Premium
- Ridge: Ventilated
- Gutter: Large
- Complexity Score: 9/10 (High)

After Optimization:
- Pitch: 30° (optimal for rain)
- Material: Metal (complexity 2)
- Thickness: Standard
- Ridge: Standard
- Gutter: Standard
- Complexity Score: 4/10 (Medium)

Benefits:
✓ 56% complexity reduction
✓ ~40% cost savings
✓ Faster installation
✓ Still excellent for heavy rain
```

---

## User Interface Components

### 1. **Statistics Cards** (4 cards)

- **Roof Area**: Calculated total area with pitch factor
- **Complexity Score**: Visual score with color coding (green/yellow/red)
- **Total Cost**: Sum of material + labor costs
- **Material**: Selected material with price per sq.m

### 2. **Measurement Form** (Sticky Left Column)

- Length & Width inputs (meters)
- Pitch selection dropdown (11 options with climate descriptions)
- Number of floors input
- Roof type selection

### 3. **Material Selection** (Sticky Left Column)

- 5 material cards with prices and descriptions
- Visual selection with icons
- Price comparison

### 4. **Additional Specifications** (Collapsible)

- Auto-expands when user changes from defaults
- Budget level selection
- Material thickness selection
- Ridge and gutter specifications
- Helpful tips displayed

### 5. **Calculation Results**

- Area breakdown
- Material cost
- Labor cost (30% of material)
- Total estimated cost
- **Optimize button** with loading animation

### 6. **Project Analysis & Insights**

- Material recommendation with reasoning
- Complexity meter with progress bar
- Optimization tips (categorized by severity)
- Factor analysis badges

---

## Technical Implementation

### Technology Stack

- **Frontend**: Next.js 15.5.4 with React 18
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **UI Components**: Shadcn UI + Tailwind CSS
- **Type Safety**: TypeScript
- **Routing**: Next.js App Router with query state (nuqs)

### Key Files

```
src/
├── app/dashboard/roof-calculator/
│   ├── index.tsx                    # Main component
│   ├── hooks/index.ts               # useRoofCalculator custom hook
│   ├── types/index.ts               # TypeScript interfaces
│   ├── utils/index.ts               # Utility functions
│   └── components/
│       ├── measurement-form.tsx     # Input form
│       ├── material-selection.tsx   # Material cards
│       ├── additional-specs.tsx     # Specifications form
│       ├── calculation-results.tsx  # Cost breakdown
│       ├── stats-cards.tsx          # Statistics display
│       ├── decision-insights.tsx    # Analysis & tips
│       └── complexity-meter.tsx     # Complexity visualization
├── lib/
│   └── decision-tree.ts             # Core decision tree algorithm
```

### State Management

```typescript
interface Measurements {
  length: string;
  width: string;
  pitch: string;
  roofType: string;
  floors: string;
  materialThickness: string;
  ridgeType: string;
  gutterSize: string;
  budgetLevel: string;
}

interface CalculationResults {
  area: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

interface DecisionTreeResult {
  materialRecommendation: MaterialRecommendation;
  complexity: ComplexityScore;
  optimizationTips: string[];
}
```

### Real-time Calculation Flow

```typescript
useEffect(() => {
  // Triggered whenever measurements or material changes
  calculateRoof();
}, [measurements, material]);

function calculateRoof() {
  // 1. Parse inputs
  const length = parseFloat(measurements.length);
  const width = parseFloat(measurements.width);
  const pitch = parseFloat(measurements.pitch);

  // 2. Calculate area
  const baseArea = length * width;
  const pitchFactor = 1 + Math.sin((pitch * Math.PI) / 180);
  const totalArea = baseArea * pitchFactor;

  // 3. Calculate costs
  const materialCost = totalArea * materialPrice;
  const laborCost = materialCost * 0.3;
  const totalCost = materialCost + laborCost;

  // 4. Run decision tree analysis
  const analysis = analyzeProject({
    roofType,
    pitch,
    area: totalArea,
    material,
    floors,
    materialThickness,
    ridgeType,
    gutterSize,
    budgetLevel,
  });

  // 5. Update state
  setResults({ area, materialCost, laborCost, totalCost });
  setDecisionTree(analysis);
}
```

---

## Usage Guide

### Basic Workflow

1. **Enter Roof Dimensions**
   - Input length and width in meters
   - Select roof pitch (recommended: 15-30° for heavy rain)
   - Choose roof type (Gable is most common)
   - Specify number of floors

2. **Select Material**
   - Choose based on budget and preferences
   - Consider complexity level
   - Review price per square meter

3. **Configure Specifications** (Optional)
   - Set budget level for better recommendations
   - Choose material thickness
   - Select ridge and gutter specifications
   - Section auto-expands when changed

4. **Review Results**
   - Check calculated roof area
   - Review cost breakdown
   - Note complexity score

5. **Analyze Insights**
   - Read material recommendation
   - Review complexity factors
   - Follow optimization tips

6. **Optimize** (Optional)
   - Click "Optimize" button
   - System adjusts settings to reduce complexity
   - Review changes and adjust if needed

7. **Finalize Estimate**
   - Review total cost
   - Note any special considerations
   - Add 10% buffer for waste

### Best Practices

✅ **For Heavy Rain Areas (Philippines)**

- Use 20-30° pitch for optimal water runoff
- Consider metal or tile materials for durability
- Ensure large gutters for roofs over 150 sq.m
- Budget for proper waterproofing

✅ **For Budget-Conscious Projects**

- Choose asphalt shingles for cost-effectiveness
- Use standard thickness materials
- Optimize settings to reduce complexity
- Consider phased approach for large projects

✅ **For Premium Projects**

- Select tile or slate for longevity and aesthetics
- Use premium thickness for better durability
- Install ventilated ridge caps for attic ventilation
- Budget 20-30% extra for custom work

✅ **For Multi-Story Buildings**

- Add 10% to labor costs for 2-story
- Add 15-25% to labor costs for 3+ stories
- Ensure proper safety equipment is budgeted
- Consider scaffolding costs

---

## Calculation Examples

### Example 1: Small Residential (Low Budget)

**Inputs:**

- Length: 8m, Width: 6m
- Pitch: 25° (good for rain)
- Roof Type: Gable
- Floors: 1
- Material: Asphalt Shingles (₱350/sq.m)
- Budget: Low
- All specs: Standard

**Calculations:**

```
Base Area: 8 × 6 = 48 sq.m
Pitch Factor: 1 + sin(25° × π/180) = 1.423
Total Area: 48 × 1.423 = 68.3 sq.m

Material Cost: 68.3 × ₱350 = ₱23,905
Labor Cost: ₱23,905 × 0.30 = ₱7,172
Total Cost: ₱31,077
```

**Complexity Score: 2/10 (Low)**

- Factors: Standard pitch, simple roof type, small area, basic material

**Recommendation:** ✅ Optimal configuration for budget

---

### Example 2: Medium Residential (Medium Budget)

**Inputs:**

- Length: 12m, Width: 10m
- Pitch: 30° (perfect for rain)
- Roof Type: Hip
- Floors: 2
- Material: Metal Roofing (₱750/sq.m)
- Budget: Medium
- Thickness: Standard, Ridge: Ventilated, Gutter: Large

**Calculations:**

```
Base Area: 12 × 10 = 120 sq.m
Pitch Factor: 1 + sin(30° × π/180) = 1.5
Total Area: 120 × 1.5 = 180 sq.m

Material Cost: 180 × ₱750 = ₱135,000
Base Labor: ₱135,000 × 0.30 = ₱40,500
Labor (2-story): ₱40,500 × 1.10 = ₱44,550
Total Cost: ₱179,550
```

**Complexity Score: 6/10 (Medium)**

- Factors: Optimal pitch, Hip roof, large area, 2-story, ventilated ridge

**Recommendation:** ✅ Good balance of cost and quality

---

### Example 3: Large Residential (High Budget)

**Inputs:**

- Length: 18m, Width: 12m
- Pitch: 35° (excellent for rain)
- Roof Type: Mansard
- Floors: 3
- Material: Clay Tiles (₱1,200/sq.m)
- Budget: High
- Thickness: Premium, Ridge: Ventilated, Gutter: Large

**Calculations:**

```
Base Area: 18 × 12 = 216 sq.m
Pitch Factor: 1 + sin(35° × π/180) = 1.574
Total Area: 216 × 1.574 = 340 sq.m

Material Cost: 340 × ₱1,200 = ₱408,000
Base Labor: ₱408,000 × 0.30 = ₱122,400
Labor (3-story): ₱122,400 × 1.20 = ₱146,880
Total Cost: ₱554,880
```

**Complexity Score: 9/10 (High)**

- Factors: Steep pitch, complex roof, very large area, premium material, 3-story, premium specs

**Recommendation:** ⚠️ Consider optimization

- Optimize to Metal (complexity 2) with Standard thickness
- New Total: ~₱380,000 (31% savings)
- Complexity: 6/10 (Medium)

---

## Frequently Asked Questions

### Q: How accurate are the cost estimates?

**A:** Estimates include material and basic labor costs (30% of materials). Actual costs may vary ±15-20% based on location, contractor rates, site conditions, and additional requirements (permits, waste removal, underlayment, flashing, etc.).

### Q: What does the complexity score mean?

**A:** The complexity score (1-10) indicates project difficulty:

- **Low (1-3)**: DIY-friendly with basic skills
- **Medium (4-6)**: Requires experienced contractor
- **High (7-10)**: Needs specialized expertise and equipment

### Q: How does the Optimize button work?

**A:** The Optimize button analyzes your inputs and adjusts settings to reduce complexity while maintaining quality. It considers your budget level and recommends appropriate materials, pitch angles, and specifications for heavy rain areas.

### Q: Why is my labor cost higher than 30%?

**A:** Labor costs increase for:

- Multi-story buildings (+10-25%)
- Very steep pitches (+15%)
- Complex roof types
- Remote locations
- Complex installations

### Q: What pitch is best for heavy rain?

**A:** For areas with heavy rainfall (like the Philippines), 20-30° pitch is optimal. This provides excellent water runoff while keeping installation complexity reasonable.

### Q: When should I use ventilated ridge caps?

**A:** Recommended for:

- Pitches over 30°
- Hot climates needing attic ventilation
- Preventing moisture buildup
- Improving energy efficiency

### Q: How much material waste should I budget?

**A:** Always add 10% extra material for:

- Cutting waste
- Mistakes and adjustments
- Future repairs
- Complex roof shapes (add 15%)

---

## Support & Maintenance

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1024x768

### Data Privacy

- All calculations performed client-side
- No data stored on servers
- No personal information collected

### Future Enhancements

- [ ] Export estimates to PDF
- [ ] Save and compare multiple projects
- [ ] Integration with supplier pricing APIs
- [ ] 3D roof visualization
- [ ] Weather data integration
- [ ] Contractor network matching

---

## Technical Support

For issues, questions, or feature requests, please contact:

- **Project**: RoofCalc - Roofing Cost Estimation System
- **Technology**: Next.js 15 + React 18 + TypeScript
- **Version**: 1.0.0

---

## License & Credits

**RoofCalc: A Roofing Cost Estimation System for Residential Construction Projects Using Decision Tree Algorithm**

Built with ❤️ for the construction industry

---

_Last Updated: October 2025_
_Documentation Version: 1.0.0_
