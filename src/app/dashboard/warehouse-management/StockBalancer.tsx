"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  capacity?: number;
  length?: number;
  width?: number;
  height?: number;
}

interface WarehouseMaterial {
  id: string;
  materialId: string;
  quantity: number;
  material: {
    id: string;
    label: string;
    category: string;
    length?: number;
    width?: number;
    height?: number;
    volume?: number;
  };
}

interface StockBalancerProps {
  warehouses: Warehouse[];
  onWarehouseUpdate: () => void;
  onMaterialsRefresh?: () => void;
}

interface RedistributionPlan {
  fromWarehouse: string;
  toWarehouse: string;
  materialId: string;
  materialName: string;
  quantity: number;
  reason: string;
}

const StockBalancer: React.FC<StockBalancerProps> = ({
  warehouses,
  onWarehouseUpdate,
  onMaterialsRefresh
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRedistributing, setIsRedistributing] = useState(false);
  const [redistributionPlan, setRedistributionPlan] = useState<RedistributionPlan[]>([]);
  const [warehouseUtilization, setWarehouseUtilization] = useState<Record<string, { used: number; capacity: number; percentage: number }>>({});

  // Calculate warehouse utilization
  useEffect(() => {
    const calculateUtilization = async () => {
      const utilization: Record<string, { used: number; capacity: number; percentage: number }> = {};
      
      // Fetch materials for all warehouses
      for (const warehouse of warehouses) {
        try {
          const response = await fetch(`/api/warehouses/${warehouse.id}/materials`);
          if (response.ok) {
            const result = await response.json();
            const materials = result.data || [];
            const used = materials.reduce((sum: number, m: WarehouseMaterial) => {
              // Calculate volume based on material dimensions
              let unitVolume = 1; // Default fallback
              
              if (m.material.volume && m.material.volume > 0) {
                unitVolume = m.material.volume;
              } else if (m.material.length && m.material.width && m.material.height) {
                unitVolume = m.material.length * m.material.width * m.material.height;
              }
              
              return sum + (m.quantity * unitVolume);
            }, 0);
            const capacity = warehouse.capacity || 0;
            const percentage = capacity > 0 ? (used / capacity) * 100 : 0;
            
            utilization[warehouse.id] = { used, capacity, percentage };
          } else {
            utilization[warehouse.id] = { used: 0, capacity: warehouse.capacity || 0, percentage: 0 };
          }
        } catch (error) {
          console.error(`Error fetching materials for warehouse ${warehouse.id}:`, error);
          utilization[warehouse.id] = { used: 0, capacity: warehouse.capacity || 0, percentage: 0 };
        }
      }
      
      setWarehouseUtilization(utilization);
    };
    
    if (warehouses.length > 0) {
      calculateUtilization();
    }
  }, [warehouses]);

  const analyzeStockDistribution = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate analysis delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const plan: RedistributionPlan[] = [];
      
      // Single warehouse optimization - suggest material reductions
      const currentWarehouse = warehouses[0]; // Use the first (and likely only) warehouse
      const currentUtilization = warehouseUtilization[currentWarehouse.id]?.percentage || 0;
      
      console.log('Current warehouse utilization:', {
        name: currentWarehouse.name,
        utilization: currentUtilization,
        used: warehouseUtilization[currentWarehouse.id]?.used,
        capacity: warehouseUtilization[currentWarehouse.id]?.capacity
      });
      
      // Target utilization threshold - balance to stay below 85% capacity
      const targetUtilization = 85;
      
      if (currentUtilization > targetUtilization) {
        // Warehouse is overloaded - suggest reducing material quantities
        try {
          const response = await fetch(`/api/warehouses/${currentWarehouse.id}/materials`);
          if (response.ok) {
            const result = await response.json();
            const materials = result.data || [];
            
            // Calculate how much we need to reduce to reach target utilization
            const currentUsed = warehouseUtilization[currentWarehouse.id]?.used || 0;
            const capacity = warehouseUtilization[currentWarehouse.id]?.capacity || 0;
            const targetUsed = (capacity * targetUtilization) / 100;
            const excessAmount = currentUsed - targetUsed;
            const targetReduction = Math.ceil(excessAmount * 1.1); // Reduce 10% more than excess to be safe
            
            console.log('Reduction needed:', {
              currentUsed,
              capacity,
              targetUsed,
              excessAmount,
              targetReduction,
              materialsCount: materials.length
            });
            
            // Sort materials by quantity (highest first) for reduction suggestions
            const sortedMaterials = materials
              .filter((m: WarehouseMaterial) => m.quantity > 0)
              .sort((a: WarehouseMaterial, b: WarehouseMaterial) => b.quantity - a.quantity);
            
            let remainingReduction = targetReduction;
            
            for (const material of sortedMaterials) {
              if (remainingReduction <= 0) break;
              
              // Suggest reducing this material by up to 50% of its current quantity
              const maxReduction = Math.floor(material.quantity * 0.5);
              const suggestedReduction = Math.min(maxReduction, remainingReduction);
              
              console.log('Material analysis:', {
                name: material.material.label,
                currentQuantity: material.quantity,
                maxReduction,
                suggestedReduction,
                materialId: material.id,
                pricingConfigId: material.materialId
              });
              
              if (suggestedReduction > 0 && suggestedReduction < material.quantity) {
                const newQuantity = material.quantity - suggestedReduction;
                
                plan.push({
                  fromWarehouse: currentWarehouse.id,
                  toWarehouse: 'REDUCE', // Special indicator for reduction
                  materialId: material.id, // Use warehouse material ID, not pricing config ID
                  materialName: material.material.label,
                  quantity: suggestedReduction,
                  reason: `Reduce ${material.material.label} from ${material.quantity} to ${newQuantity} units (utilization: ${currentUtilization.toFixed(1)}% → ${((currentUsed - suggestedReduction) / capacity * 100).toFixed(1)}%)`
                });
                
                remainingReduction -= suggestedReduction;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching materials for warehouse ${currentWarehouse.id}:`, error);
        }
      }
      
      setRedistributionPlan(plan);
      
      if (plan.length === 0) {
        if (currentUtilization <= targetUtilization) {
          toast.success("Stock distribution is optimal!", {
            description: `Warehouse utilization is within acceptable limits (${currentUtilization.toFixed(1)}% ≤ ${targetUtilization}%).`,
          });
        } else {
          toast.warning("No reduction plan generated", {
            description: "Unable to generate automatic reduction suggestions. Consider manually reducing material quantities.",
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing stock distribution:', error);
      toast.error("Failed to analyze stock distribution");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeRedistribution = async () => {
    setIsRedistributing(true);
    try {
      // Group by material for efficient API calls
      const materialGroups = redistributionPlan.reduce((groups, item) => {
        if (!groups[item.materialId]) {
          groups[item.materialId] = [];
        }
        groups[item.materialId].push(item);
        return groups;
      }, {} as Record<string, RedistributionPlan[]>);

      // Execute material reductions
      for (const [materialId, items] of Object.entries(materialGroups)) {
        for (const item of items) {
          if (item.toWarehouse === 'REDUCE') {
            // This is a material reduction, not a transfer
            // materialId here is the warehouse material ID, not the pricing config ID
            const sourceResponse = await fetch(`/api/warehouses/${item.fromWarehouse}/materials`);
            let currentQuantity = 0;
            if (sourceResponse.ok) {
              const sourceResult = await sourceResponse.json();
              const sourceMaterial = sourceResult.data.find((m: WarehouseMaterial) => m.id === materialId);
              currentQuantity = sourceMaterial?.quantity || 0;
            }

            // Reduce quantity in the warehouse
            const newQuantity = Math.max(0, currentQuantity - item.quantity);
            
            console.log(`Reducing material ${materialId} from ${currentQuantity} to ${newQuantity}`);
            
            const response = await fetch(`/api/warehouses/${item.fromWarehouse}/materials/${materialId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quantity: newQuantity
              }),
            });

            if (!response.ok) {
              console.error(`Failed to update material ${materialId}:`, response.status, await response.text());
            }
          } else {
            // This is a transfer between warehouses (legacy support)
            const sourceResponse = await fetch(`/api/warehouses/${item.fromWarehouse}/materials`);
            let currentQuantity = 0;
            if (sourceResponse.ok) {
              const sourceResult = await sourceResponse.json();
              const sourceMaterial = sourceResult.data.find((m: WarehouseMaterial) => m.materialId === materialId);
              currentQuantity = sourceMaterial?.quantity || 0;
            }

            // Remove from source warehouse
            await fetch(`/api/warehouses/${item.fromWarehouse}/materials/${materialId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quantity: currentQuantity - item.quantity
              }),
            });

            // Add to target warehouse
            await fetch(`/api/warehouses/${item.toWarehouse}/materials`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                materialId: materialId,
                quantity: item.quantity,
                locationAdjustment: 0
              }),
            });
          }
        }
      }

      const hasReductions = redistributionPlan.some(item => item.toWarehouse === 'REDUCE');
      toast.success(hasReductions ? "Material reductions completed!" : "Stock redistribution completed!", {
        description: `${redistributionPlan.length} ${hasReductions ? 'reductions' : 'transfers'} completed successfully.`,
      });

      setRedistributionPlan([]);
      onWarehouseUpdate();
      onMaterialsRefresh?.(); // Trigger refresh of materials data
      
      // Multiple refresh attempts to ensure data is updated
      const refreshUtilization = async () => {
        const utilization: Record<string, { used: number; capacity: number; percentage: number }> = {};
        
        // Fetch materials for all warehouses
        for (const warehouse of warehouses) {
          try {
            const response = await fetch(`/api/warehouses/${warehouse.id}/materials`);
            if (response.ok) {
              const result = await response.json();
              const materials = result.data || [];
              const used = materials.reduce((sum: number, m: WarehouseMaterial) => {
                // Calculate volume based on material dimensions
                let unitVolume = 1; // Default fallback
                
                if (m.material.volume && m.material.volume > 0) {
                  unitVolume = m.material.volume;
                } else if (m.material.length && m.material.width && m.material.height) {
                  unitVolume = m.material.length * m.material.width * m.material.height;
                }
                
                return sum + (m.quantity * unitVolume);
              }, 0);
              const capacity = warehouse.capacity || 0;
              const percentage = capacity > 0 ? (used / capacity) * 100 : 0;
              
              utilization[warehouse.id] = { used, capacity, percentage };
            } else {
              utilization[warehouse.id] = { used: 0, capacity: warehouse.capacity || 0, percentage: 0 };
            }
          } catch (error) {
            console.error(`Error fetching materials for warehouse ${warehouse.id}:`, error);
            utilization[warehouse.id] = { used: 0, capacity: warehouse.capacity || 0, percentage: 0 };
          }
        }
        
        setWarehouseUtilization(utilization);
      };
      
      // Try multiple times to ensure database is updated
      if (warehouses.length > 0) {
        // Immediate refresh
        refreshUtilization();
        
        // Refresh after 500ms
        setTimeout(refreshUtilization, 500);
        
        // Final refresh after 1.5s
        setTimeout(refreshUtilization, 1500);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error executing redistribution:', error);
      toast.error("Failed to execute redistribution");
    } finally {
      setIsRedistributing(false);
    }
  };


  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 80) return "Overloaded";
    if (percentage >= 60) return "High";
    if (percentage >= 40) return "Medium";
    return "Low";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Stock Balancer
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Smart Stock Balancer
          </DialogTitle>
          <DialogDescription>
            Analyze and balance materials to maintain optimal warehouse capacity utilization (target: ≤85%)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Warehouse Utilization Status</CardTitle>
              <CardDescription>
                Current capacity utilization across all warehouses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {warehouses.map(warehouse => {
                const utilization = warehouseUtilization[warehouse.id];
                if (!utilization) return null;

                return (
                  <div key={warehouse.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{warehouse.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({warehouse.city}, {warehouse.state})
                        </span>
                      </div>
                      <Badge variant={
                        utilization.percentage >= 80 ? "destructive" :
                        utilization.percentage >= 60 ? "secondary" : "default"
                      }>
                        {getUtilizationStatus(utilization.percentage)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{utilization.used} / {utilization.capacity} m³</span>
                        <span>{utilization.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={utilization.percentage} 
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Analysis and Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={analyzeStockDistribution}
              disabled={isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Distribution...
                </>
              ) : (
                'Analyze Stock Distribution'
              )}
            </Button>
          </div>

          {/* Redistribution Plan */}
          {redistributionPlan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {redistributionPlan.some(item => item.toWarehouse === 'REDUCE') ? 'Material Reduction Plan' : 'Redistribution Plan'}
                </CardTitle>
                <CardDescription>
                  {redistributionPlan.some(item => item.toWarehouse === 'REDUCE') 
                    ? `${redistributionPlan.length} material reductions recommended to fix overload`
                    : `${redistributionPlan.length} material transfers recommended`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {redistributionPlan.map((item, index) => {
                    const fromWarehouse = warehouses.find(w => w.id === item.fromWarehouse);
                    const isReduction = item.toWarehouse === 'REDUCE';
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{item.materialName}</span>
                          <Badge variant={isReduction ? "destructive" : "outline"}>
                            {isReduction ? `-${item.quantity} units` : `${item.quantity} units`}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isReduction ? (
                            <div className="flex items-center gap-2">
                              <span className="text-red-600">Reduce in:</span>
                              <span>{fromWarehouse?.name}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-red-600">From:</span>
                                <span>{fromWarehouse?.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-green-600">To:</span>
                                <span>{warehouses.find(w => w.id === item.toWarehouse)?.name}</span>
                              </div>
                            </>
                          )}
                          <div className="text-xs mt-1 italic">{item.reason}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Alert>
                    <AlertDescription>
                      {redistributionPlan.some(item => item.toWarehouse === 'REDUCE') 
                        ? "This will reduce material quantities to fix warehouse overload. Materials will be permanently reduced from inventory."
                        : "This will move materials between warehouses. Make sure all affected warehouses are accessible."
                      }
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={executeRedistribution}
                    disabled={isRedistributing}
                    className="w-full mt-4"
                  >
                    {isRedistributing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {redistributionPlan.some(item => item.toWarehouse === 'REDUCE') ? 'Executing Reductions...' : 'Executing Redistribution...'}
                      </>
                    ) : (
                      redistributionPlan.some(item => item.toWarehouse === 'REDUCE') ? 'Execute Reduction Plan' : 'Execute Redistribution Plan'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {redistributionPlan.length === 0 && !isAnalyzing && (
            <Alert>
              <AlertDescription>
                Click &quot;Analyze Stock Distribution&quot; to generate optimization recommendations. 
                This will suggest material reductions to maintain capacity utilization below 85% for optimal performance.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockBalancer;
