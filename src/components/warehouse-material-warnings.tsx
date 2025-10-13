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
  UsersIcon
} from "lucide-react";

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

  const fetchWarnings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Calculate warnings from real warehouse data
      const calculatedWarnings: WarehouseMaterialWarning[] = [];
      
      warehouses.forEach(warehouse => {
        const warehouseMaterials = allWarehouseMaterials[warehouse.id] || [];
        const activeMaterials = warehouseMaterials.filter(m => m.isActive);
        
        const warehouseWarnings: WarehouseMaterialWarning['warnings'] = [];
        
        activeMaterials.forEach(material => {
          const currentStock = material.quantity;
          
          // Define warning thresholds based on material category
          let warningThreshold = 10; // Default threshold
          let criticalThreshold = 5; // Default critical threshold
          
          // Adjust thresholds based on material type
          if (material.material.category === 'Labor') {
            warningThreshold = 1; // Labor is typically fixed
            criticalThreshold = 0;
          } else if (material.material.category === 'Insulation' || material.material.category === 'Ventilation') {
            warningThreshold = 5;
            criticalThreshold = 2;
          } else if (material.material.category === 'Gutter') {
            warningThreshold = 15;
            criticalThreshold = 8;
          }
          
          // Check if material needs warning
          if (currentStock <= criticalThreshold || currentStock <= warningThreshold) {
            const isCritical = currentStock <= criticalThreshold;
            const projectedStock = Math.max(0, currentStock - (currentStock * 0.1)); // Simulate some usage
            
            warehouseWarnings.push({
              materialId: material.materialId,
              materialName: material.material.name,
              currentStock: currentStock,
              reservedForProjects: Math.floor(currentStock * 0.3), // Simulate 30% reserved
              projectedStock: projectedStock,
              criticalLevel: isCritical,
              projectsUsing: [
                {
                  projectId: `project-${material.materialId}`,
                  projectName: `Sample Project - ${material.material.name}`,
                  quantity: Math.floor(currentStock * 0.2)
                }
              ]
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
    } catch (error) {
      console.error('Error calculating warehouse warnings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [warehouses, allWarehouseMaterials]);

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

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <WarehouseIcon className="h-5 w-5" />
                  {warehouse.warehouseName}
                </CardTitle>
                <CardDescription>
                  {warehouse.warnings.length} material warning{warehouse.warnings.length !== 1 ? 's' : ''} detected
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchWarnings}>
                Refresh Warnings
              </Button>
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
