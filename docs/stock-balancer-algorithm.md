# Stock Balancer Algorithm Documentation

## Overview

The Stock Balancer is an intelligent warehouse management system that analyzes material distribution across warehouses and provides automated optimization recommendations. It focuses on maintaining optimal warehouse capacity utilization while preventing overloading scenarios.

## Core Algorithm

### 1. Capacity Utilization Calculation

The algorithm calculates warehouse utilization based on material volume:

```typescript
// For each material in a warehouse
let unitVolume = 1; // Default fallback

if (material.volume && material.volume > 0) {
    unitVolume = material.volume;
} else if (material.length && material.width && material.height) {
    unitVolume = material.length * material.width * material.height;
}

totalUsed = sum(material.quantity * unitVolume)
utilization = (totalUsed / warehouse.capacity) * 100
```

**Volume Calculation Priority:**
1. **Direct Volume**: If material has a defined `volume` property
2. **Calculated Volume**: `length × width × height` if dimensions are available
3. **Default Fallback**: 1 m³ per unit if no volume data exists

### 2. Utilization Status Classification

The system classifies warehouse utilization into four categories:

| Utilization | Status | Color | Action Required |
|-------------|--------|-------|-----------------|
| ≥80% | Overloaded | Red | Immediate reduction needed |
| 60-79% | High | Orange | Monitor closely |
| 40-59% | Medium | Blue | Optimal range |
| <40% | Low | Green | Can accept more materials |

### 3. Stock Distribution Analysis Algorithm

#### Target Utilization Threshold
- **Target**: ≤85% capacity utilization
- **Reasoning**: Maintains buffer space for operational efficiency and prevents overloading

#### Analysis Process

1. **Current State Assessment**
   ```typescript
   currentUtilization = calculateUtilization(warehouse)
   currentUsed = sum(materials.quantity * volume)
   capacity = warehouse.capacity
   ```

2. **Overload Detection**
   ```typescript
   if (currentUtilization > 85%) {
       // Generate reduction recommendations
       excessAmount = currentUsed - (capacity * 0.85)
       targetReduction = excessAmount * 1.1 // 10% safety buffer
   }
   ```

3. **Material Prioritization for Reduction**
   ```typescript
   // Sort materials by quantity (highest first)
   sortedMaterials = materials
       .filter(m => m.quantity > 0)
       .sort((a, b) => b.quantity - a.quantity)
   ```

4. **Reduction Strategy**
   ```typescript
   for each material in sortedMaterials {
       maxReduction = floor(material.quantity * 0.5) // Max 50% reduction
       suggestedReduction = min(maxReduction, remainingTargetReduction)
       
       if (suggestedReduction > 0 && suggestedReduction < material.quantity) {
           addToReductionPlan(material, suggestedReduction)
           remainingTargetReduction -= suggestedReduction
       }
   }
   ```

### 4. Redistribution Plan Generation

#### Single Warehouse Optimization (Current Implementation)

Since most setups have a single warehouse, the algorithm focuses on **material reduction** rather than inter-warehouse transfers:

```typescript
interface RedistributionPlan {
    fromWarehouse: string;
    toWarehouse: 'REDUCE'; // Special indicator for reduction
    materialId: string;
    materialName: string;
    quantity: number; // Amount to reduce
    reason: string; // Detailed explanation
}
```

#### Reduction Logic

1. **Calculate Required Reduction**
   - Current utilization: 95%
   - Target utilization: 85%
   - Excess volume: `currentUsed - (capacity * 0.85)`
   - Target reduction: `excessVolume * 1.1` (10% safety margin)

2. **Prioritize Materials**
   - Sort by current quantity (highest first)
   - Maximum reduction per material: 50% of current quantity
   - Never reduce below 1 unit

3. **Generate Recommendations**
   ```typescript
   newQuantity = material.quantity - suggestedReduction
   projectedUtilization = ((currentUsed - suggestedReduction) / capacity) * 100
   
   reason = `Reduce ${materialName} from ${currentQuantity} to ${newQuantity} units 
            (utilization: ${currentUtilization}% → ${projectedUtilization}%)`
   ```

### 5. Execution Algorithm

#### Reduction Execution Process

```typescript
async function executeRedistribution() {
    for each reductionPlan item {
        if (item.toWarehouse === 'REDUCE') {
            // Fetch current quantity
            currentQuantity = getCurrentMaterialQuantity(item.materialId)
            
            // Calculate new quantity
            newQuantity = max(0, currentQuantity - item.quantity)
            
            // Update warehouse material
            await updateWarehouseMaterial(item.materialId, {
                quantity: newQuantity
            })
        }
    }
}
```

#### Safety Measures

1. **Validation**: Always verify current quantity before reduction
2. **Bounds Checking**: Never reduce below 0 units
3. **Atomic Operations**: Each reduction is independent
4. **Error Handling**: Failed reductions don't affect other operations

## Multi-Warehouse Support (Future Enhancement)

While currently optimized for single warehouse scenarios, the algorithm is designed to support multi-warehouse redistribution:

### Transfer Algorithm (Legacy Support)

```typescript
// Remove from source warehouse
await updateWarehouseMaterial(sourceWarehouse, materialId, {
    quantity: currentQuantity - transferQuantity
})

// Add to target warehouse
await createWarehouseMaterial(targetWarehouse, {
    materialId: materialId,
    quantity: transferQuantity,
    locationAdjustment: 0
})
```

### Future Multi-Warehouse Logic

1. **Load Balancing**: Distribute materials across warehouses for optimal utilization
2. **Geographic Optimization**: Consider delivery distances and costs
3. **Demand-Based Distribution**: Allocate based on regional demand patterns

## Real-Time Data Integration

### Data Sources

The algorithm uses real-time warehouse materials data:

```typescript
// Real-time materials cache
warehouseMaterials: Record<string, WarehouseMaterial[]>

// Utilization calculation with live data
const materials = warehouseMaterials?.[warehouse.id] || []
const activeMaterials = materials.filter(m => m.isActive)
```

### Refresh Triggers

The system automatically recalculates utilization when:

1. **Modal Opens**: Fresh data on dialog open
2. **Materials Updated**: After add/remove/edit operations
3. **Refresh Trigger**: External refresh signal
4. **Warehouse Changes**: When warehouse data is modified

## Performance Considerations

### Optimization Strategies

1. **Debounced Calculations**: Utilization calculated only when needed
2. **Cached Results**: Warehouse utilization cached between operations
3. **Incremental Updates**: Only recalculate affected warehouses
4. **Lazy Loading**: Data fetched only when analysis is requested

### Scalability

- **Time Complexity**: O(n) where n = total materials across warehouses
- **Space Complexity**: O(w + m) where w = warehouses, m = materials
- **API Calls**: Minimized through caching and batch operations

## Error Handling & Edge Cases

### Common Scenarios

1. **No Capacity Defined**: Default to 0% utilization
2. **Missing Volume Data**: Fallback to 1 m³ per unit
3. **API Failures**: Graceful degradation with error messages
4. **Insufficient Materials**: No reduction plan generated

### Validation Rules

```typescript
// Capacity validation
if (warehouse.capacity <= 0) {
    utilization = 0
    status = "No capacity defined"
}

// Material validation
if (material.quantity <= 0) {
    skip material in reduction calculations
}

// Reduction validation
if (suggestedReduction >= material.quantity) {
    skip material (would eliminate entirely)
}
```

## User Experience Features

### Visual Indicators

- **Progress Bars**: Real-time utilization visualization
- **Status Badges**: Color-coded utilization levels
- **Detailed Reasons**: Clear explanations for each recommendation

### Interactive Elements

- **Analysis Button**: Manual trigger for distribution analysis
- **Execute Button**: Confirmation before applying changes
- **Progress Indicators**: Loading states during operations

### Feedback System

- **Success Messages**: Confirmation of completed operations
- **Warning Messages**: Alerts for potential issues
- **Error Messages**: Clear error descriptions with suggestions

## Configuration Options

### Tunable Parameters

```typescript
const CONFIG = {
    targetUtilization: 85,        // Target utilization percentage
    safetyBuffer: 1.1,           // 10% safety margin for reductions
    maxReductionPercent: 0.5,    // Maximum 50% reduction per material
    analysisDelay: 1500,         // UX delay for analysis (ms)
}
```

### Customization Points

1. **Target Utilization**: Adjustable based on business requirements
2. **Reduction Limits**: Configurable maximum reduction percentages
3. **Safety Buffers**: Adjustable margins for conservative operations
4. **Analysis Timing**: Configurable delays for better UX

## API Integration

### Endpoints Used

- `GET /api/warehouses/{id}/materials` - Fetch warehouse materials
- `PUT /api/warehouses/{id}/materials/{materialId}` - Update material quantity
- `POST /api/warehouses/{id}/materials` - Add new material (for transfers)

### Request/Response Patterns

```typescript
// Update material quantity
PUT /api/warehouses/{warehouseId}/materials/{materialId}
{
    "quantity": newQuantity
}

// Response
{
    "success": true,
    "data": updatedMaterial
}
```

## Future Enhancements

### Planned Features

1. **Predictive Analysis**: ML-based demand forecasting
2. **Cost Optimization**: Consider transportation costs in redistribution
3. **Seasonal Adjustments**: Time-based utilization targets
4. **Integration APIs**: Connect with external inventory systems
5. **Advanced Analytics**: Detailed reporting and insights

### Algorithm Improvements

1. **Genetic Algorithms**: For complex multi-warehouse optimization
2. **Constraint Satisfaction**: Handle multiple optimization goals
3. **Real-time Streaming**: Continuous optimization monitoring
4. **Machine Learning**: Learn from historical patterns and user preferences

---

*This documentation covers the current implementation of the Stock Balancer algorithm. The system is designed to be extensible and can be enhanced with additional features as business requirements evolve.*
