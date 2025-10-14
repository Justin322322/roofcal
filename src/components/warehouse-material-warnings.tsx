"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  WarehouseIcon, 
  AlertTriangleIcon, 
  PackageIcon,
  RefreshCwIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

interface WarehouseMaterialWarning {
  warehouseId: string;
  warehouseName: string;
  warnings: Array<{
    materialId: string;
    materialName: string;
    currentStock: number;
    reservedForProjects: number;
    projectedStock: number;
    criticalLevel: boolean;
    projectsUsing: Array<{
      projectId: string;
      projectName: string;
      quantity: number;
    }>;
  }>;
}

interface WarehouseMaterial {
  id: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  locationAdjustment: number;
  isActive: boolean;
  material: {
    id: string;
    name: string;
    label: string;
    description: string | null;
    price: number;
    unit: string;
    category: string;
    length?: number;
    width?: number;
    height?: number;
    volume?: number;
  };
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  length?: number;
  width?: number;
  height?: number;
  capacity?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface WarehouseMaterialWarningsProps {
  warehouseId?: string;
  warehouses?: Warehouse[];
  allWarehouseMaterials?: Record<string, WarehouseMaterial[]>;
  refreshTrigger?: number;
}

export function WarehouseMaterialWarnings({ 
  warehouseId, 
  warehouses = [],
  allWarehouseMaterials = {},
  refreshTrigger 
}: WarehouseMaterialWarningsProps) {
  const [warnings, setWarnings] = useState<WarehouseMaterialWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replenishing, setReplenishing] = useState<string | null>(null);

  const calculateLocalWarnings = useCallback(() => {
    // Calculate warnings from real warehouse data as fallback
    const calculatedWarnings: WarehouseMaterialWarning[] = [];
    
    warehouses.forEach(warehouse => {
      const warehouseMaterials = allWarehouseMaterials[warehouse.id] || [];
      const activeMaterials = warehouseMaterials.filter(m => m.isActive);
      
      const warehouseWarnings: WarehouseMaterialWarning['warnings'] = [];
      
      activeMaterials.forEach(material => {
        // Skip Labor materials - they are fixed costs, not physical inventory
        if (material.material.category.toLowerCase() === 'labor') {
          return;
        }
        
        const currentStock = material.quantity;
        
        // Define warning thresholds based on material category
        let warningThreshold = 10; // Default threshold
        let criticalThreshold = 5; // Default critical threshold
        
        // Adjust thresholds based on material type
        if (material.material.category === 'Insulation' || material.material.category === 'Ventilation') {
          warningThreshold = 5;
          criticalThreshold = 2;
        } else if (material.material.category === 'Gutter') {
          warningThreshold = 15;
          criticalThreshold = 8;
        } else if (material.material.category === 'Screws' || material.material.category === 'Hardware') {
          warningThreshold = 20;
          criticalThreshold = 10;
        }
        
        // Check if material needs warning
        if (currentStock <= criticalThreshold || currentStock <= warningThreshold) {
          const isCritical = currentStock <= criticalThreshold;
          const projectedStock = Math.max(0, currentStock - (currentStock * 0.1));
          
          warehouseWarnings.push({
            materialId: material.materialId,
            materialName: material.material.name,
            currentStock: currentStock,
            reservedForProjects: 0, // Will be updated by API
            projectedStock: projectedStock,
            criticalLevel: isCritical,
            projectsUsing: [] // Will be updated by API
          });
        }
      });
      
      if (warehouseWarnings.length > 0) {
        calculatedWarnings.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          warnings: warehouseWarnings
        });
      }
    });
    
    setWarnings(calculatedWarnings);
  }, [warehouses, allWarehouseMaterials]);

  const fetchWarnings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch real warnings from API
      const response = await fetch('/api/warehouses/warnings');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.warnings) {
          setWarnings(result.warnings);
        } else {
          // Fallback to calculating from local data if API fails
          calculateLocalWarnings();
        }
      } else {
        // Fallback to calculating from local data if API fails
        calculateLocalWarnings();
      }
    } catch (error) {
      console.error('Error fetching warehouse warnings:', error);
      // Fallback to calculating from local data
      calculateLocalWarnings();
    } finally {
      setIsLoading(false);
    }
  }, [calculateLocalWarnings]);


  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings, warehouseId, refreshTrigger]);

  const getWarningLevel = (warning: WarehouseMaterialWarning['warnings'][0]) => {
    if (warning.criticalLevel || warning.projectedStock <= 0) {
      return 'critical';
    } else if (warning.projectedStock < warning.currentStock * 0.2) {
      return 'warning';
    } else {
      return 'info';
    }
  };

  const getWarningIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <PackageIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleReplenish = async (warehouseId: string, materialId: string, materialName: string) => {
    try {
      setReplenishing(materialId);
      
      const response = await fetch(`/api/warehouses/${warehouseId}/materials/${materialId}/replenish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Successfully replenished ${data.quantity} units of ${materialName}`);
        // Refresh warnings to show updated stock levels
        await fetchWarnings();
      } else {
        toast.error(data.error || 'Failed to replenish stock');
      }
    } catch (error) {
      console.error('Error replenishing stock:', error);
      toast.error('Failed to replenish stock');
    } finally {
      setReplenishing(null);
    }
  };


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5" />
                Stock Level Warnings
              </CardTitle>
              <CardDescription>Monitor material inventory levels and get alerts for low stock or critical shortages</CardDescription>
            </div>
            <Button variant="outline" disabled>
              Loading
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredWarnings = warehouseId 
    ? warnings.filter(w => w.warehouseId === warehouseId)
    : warnings;

  if (filteredWarnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5" />
                Stock Level Warnings
              </CardTitle>
              <CardDescription>Monitor material inventory levels and get alerts for low stock or critical shortages</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchWarnings}>
              Refresh Warnings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <PackageIcon className="h-4 w-4" />
            <AlertDescription>
              All warehouse materials are at healthy levels with sufficient stock for upcoming projects.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredWarnings.map((warehouse) => (
        <Card key={warehouse.warehouseId}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5" />
                {warehouse.warehouseName}
              </CardTitle>
              <CardDescription>
                {warehouse.warnings.length} material warning{warehouse.warnings.length !== 1 ? 's' : ''} detected
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Projected</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouse.warnings.map((warning) => {
                    const warningLevel = getWarningLevel(warning);
                    return (
                      <TableRow key={warning.materialId}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {getWarningIcon(warningLevel)}
                          {warning.materialName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={warningLevel === 'critical' ? 'destructive' : 'secondary'}>
                            {warningLevel.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{warning.currentStock} units</TableCell>
                        <TableCell>
                          <span className="text-yellow-600">{warning.reservedForProjects} units</span>
                        </TableCell>
                        <TableCell>
                          <span className={`${
                            warning.projectedStock <= 0 ? 'text-red-600' : 
                            warning.projectedStock < warning.currentStock * 0.2 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {warning.projectedStock} units
                          </span>
                        </TableCell>
                        <TableCell>
                          {warning.projectsUsing.length > 0 ? (
                            <div className="space-y-1">
                              {warning.projectsUsing.map((project) => (
                                <div key={project.projectId} className="text-xs">
                                  <span className="font-medium">{project.projectName}</span>
                                  <span className="text-muted-foreground ml-2">({project.quantity})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReplenish(warehouse.warehouseId, warning.materialId, warning.materialName)}
                            disabled={replenishing === warning.materialId}
                          >
                            {replenishing === warning.materialId ? (
                              <>
                                <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                                Replenishing...
                              </>
                            ) : (
                              <>
                                <RefreshCwIcon className="h-3 w-3 mr-1" />
                                Replenish
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Critical warning callouts under table for visibility */}
            {warehouse.warnings.some(w => getWarningLevel(w) === 'critical') && (
              <div className="mt-4">
                <Alert>
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    One or more materials are at critical stock levels. Consider restocking or redistributing materials from other warehouses.
                  </AlertDescription>
                </Alert>
              </div>
            )}


          </CardContent>
        </Card>
      ))}
    </div>
  );
}
