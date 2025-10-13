"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface WarehouseMaterialWarningsProps {
  warehouseId?: string;
  refreshTrigger?: number;
}

export function WarehouseMaterialWarnings({ 
  warehouseId, 
  refreshTrigger 
}: WarehouseMaterialWarningsProps) {
  const [warnings, setWarnings] = useState<WarehouseMaterialWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWarnings();
  }, [warehouseId, refreshTrigger]);

  const fetchWarnings = async () => {
    try {
      setIsLoading(true);
      // This would be a new API endpoint to get warehouse warnings
      // For now, we'll simulate the data structure
      const mockWarnings: WarehouseMaterialWarning[] = [
        {
          warehouseId: "warehouse-1",
          warehouseName: "Main Warehouse",
          warnings: [
            {
              materialId: "material-1",
              materialName: "Asphalt Shingles",
              currentStock: 150,
              reservedForProjects: 75,
              projectedStock: 75,
              criticalLevel: false,
              projectsUsing: [
                {
                  projectId: "project-1",
                  projectName: "Smith Residence Roof",
                  quantity: 50
                },
                {
                  projectId: "project-2",
                  projectName: "Johnson Office Building",
                  quantity: 25
                }
              ]
            },
            {
              materialId: "material-2",
              materialName: "Gutter System",
              currentStock: 20,
              reservedForProjects: 18,
              projectedStock: 2,
              criticalLevel: true,
              projectsUsing: [
                {
                  projectId: "project-3",
                  projectName: "Brown Family Home",
                  quantity: 18
                }
              ]
            }
          ]
        }
      ];
      
      setWarnings(mockWarnings);
    } catch (error) {
      console.error('Error fetching warehouse warnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="h-5 w-5" />
            Warehouse Inventory Warnings
          </CardTitle>
          <CardDescription>Loading inventory warnings...</CardDescription>
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
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="h-5 w-5" />
            Warehouse Inventory Warnings
          </CardTitle>
          <CardDescription>No inventory warnings at this time</CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              <WarehouseIcon className="h-5 w-5" />
              {warehouse.warehouseName}
            </CardTitle>
            <CardDescription>
              {warehouse.warnings.length} material warning{warehouse.warnings.length !== 1 ? 's' : ''} detected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {warehouse.warnings.map((warning) => {
              const warningLevel = getWarningLevel(warning);
              return (
                <div
                  key={warning.materialId}
                  className={`p-4 border rounded-lg ${getWarningColor(warningLevel)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getWarningIcon(warningLevel)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{warning.materialName}</h4>
                          <Badge variant={warningLevel === 'critical' ? 'destructive' : 'secondary'}>
                            {warningLevel.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Current Stock</div>
                            <div className="font-medium">{warning.currentStock} units</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Reserved</div>
                            <div className="font-medium text-yellow-600">{warning.reservedForProjects} units</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Projected</div>
                            <div className={`font-medium ${
                              warning.projectedStock <= 0 ? 'text-red-600' : 
                              warning.projectedStock < warning.currentStock * 0.2 ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {warning.projectedStock} units
                            </div>
                          </div>
                        </div>

                        {warning.projectsUsing.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
                              Reserved for projects:
                            </div>
                            <div className="space-y-1">
                              {warning.projectsUsing.map((project) => (
                                <div key={project.projectId} className="text-xs bg-white/50 px-2 py-1 rounded">
                                  <span className="font-medium">{project.projectName}</span>
                                  <span className="text-gray-500 ml-2">({project.quantity} units)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {warningLevel === 'critical' && (
                          <Alert className="mt-3">
                            <AlertTriangleIcon className="h-4 w-4" />
                            <AlertDescription>
                              Critical stock level! Projected inventory will be exhausted. 
                              Consider restocking or redistributing materials from other warehouses.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
