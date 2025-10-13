"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  PackageIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  RotateCcwIcon
} from "lucide-react";
import { toast } from "sonner";
import { formatStatus } from "@/lib/utils";


interface MaterialSummary {
  totalMaterials: number;
  reservedMaterials: number;
  consumedMaterials: number;
  returnedMaterials: number;
  cancelledMaterials: number;
  materials: Array<{
    id: string;
    materialName: string;
    category: string;
    quantity: number;
    status: 'RESERVED' | 'CONSUMED' | 'RETURNED' | 'CANCELLED';
    reservedAt: string;
    consumedAt?: string;
    returnedAt?: string;
    notes?: string;
  }>;
}

interface ProjectMaterialRequirementsProps {
  projectId: string;
  warehouseId?: string;
  onMaterialReturn?: () => void;
}

export function ProjectMaterialRequirements({ 
  projectId, 
  warehouseId, 
  onMaterialReturn 
}: ProjectMaterialRequirementsProps) {
  const [materialSummary, setMaterialSummary] = useState<MaterialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);

  const fetchMaterialSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/materials`);
      
      if (response.ok) {
        const data = await response.json();
        setMaterialSummary(data);
      } else {
        console.error('Failed to fetch material summary');
        toast.error("Failed to load material information");
      }
    } catch (error) {
      console.error('Error fetching material summary:', error);
      toast.error("Failed to load material information");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMaterialSummary();
  }, [fetchMaterialSummary]);

  const handleReturnMaterials = async () => {
    try {
      setIsReturning(true);
      const response = await fetch(`/api/projects/${projectId}/materials/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual return requested' })
      });

      if (response.ok) {
        toast.success("Materials returned successfully");
        await fetchMaterialSummary();
        onMaterialReturn?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to return materials");
      }
    } catch (error) {
      console.error('Error returning materials:', error);
      toast.error("Failed to return materials");
    } finally {
      setIsReturning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return <Badge variant="outline" className="text-yellow-600"><ClockIcon className="h-3 w-3 mr-1" />Reserved</Badge>;
      case 'CONSUMED':
        return <Badge variant="default" className="text-green-600"><CheckCircleIcon className="h-3 w-3 mr-1" />Consumed</Badge>;
      case 'RETURNED':
        return <Badge variant="secondary" className="text-blue-600"><RotateCcwIcon className="h-3 w-3 mr-1" />Returned</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><AlertTriangleIcon className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{formatStatus(status)}</Badge>;
    }
  };

  const hasActiveMaterials = materialSummary && (
    materialSummary.reservedMaterials > 0 || 
    materialSummary.consumedMaterials > 0
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Material Requirements
          </CardTitle>
          <CardDescription>Loading material information...</CardDescription>
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

  if (!materialSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Material Requirements
          </CardTitle>
          <CardDescription>No material information available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              Unable to load material information for this project.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5" />
              Material Requirements
            </CardTitle>
            <CardDescription>
              Material consumption status for this project
            </CardDescription>
          </div>
          {hasActiveMaterials && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturnMaterials}
              disabled={isReturning}
            >
              <RotateCcwIcon className="h-4 w-4 mr-2" />
              {isReturning ? "Returning..." : "Return Materials"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{materialSummary.totalMaterials}</div>
            <div className="text-sm text-gray-600">Total Materials</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{materialSummary.reservedMaterials}</div>
            <div className="text-sm text-yellow-600">Reserved</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{materialSummary.consumedMaterials}</div>
            <div className="text-sm text-green-600">Consumed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{materialSummary.returnedMaterials}</div>
            <div className="text-sm text-blue-600">Returned</div>
          </div>
        </div>

        {/* Material Details */}
        {materialSummary.materials.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Material Details</h4>
            <div className="space-y-2">
              {materialSummary.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900">{material.materialName}</div>
                        <div className="text-sm text-gray-500">
                          {material.category} • {material.quantity} units
                        </div>
                      </div>
                      {getStatusBadge(material.status)}
                    </div>
                    {material.notes && (
                      <div className="text-xs text-gray-500 mt-1">{material.notes}</div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Reserved: {new Date(material.reservedAt).toLocaleDateString()}</div>
                    {material.consumedAt && (
                      <div>Consumed: {new Date(material.consumedAt).toLocaleDateString()}</div>
                    )}
                    {material.returnedAt && (
                      <div>Returned: {new Date(material.returnedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert>
            <PackageIcon className="h-4 w-4" />
            <AlertDescription>
              No materials have been allocated to this project yet.
            </AlertDescription>
          </Alert>
        )}

        {/* Warehouse Info */}
        {warehouseId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <strong>Assigned Warehouse:</strong> {warehouseId}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Materials will be consumed from this warehouse when project is approved.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
