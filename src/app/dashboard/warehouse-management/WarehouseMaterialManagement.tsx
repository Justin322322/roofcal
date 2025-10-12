"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  EditIcon,
  PackageIcon,
  TrashIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Warehouse } from "./types";

interface Material {
  id: string;
  name: string;
  label: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
}

interface WarehouseMaterial {
  id: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  locationAdjustment: number;
  isActive: boolean;
  material: Material;
}

interface WarehouseMaterialManagementProps {
  warehouse: Warehouse;
  onUpdate: () => void;
}

export function WarehouseMaterialManagement({ warehouse, onUpdate }: WarehouseMaterialManagementProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<WarehouseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<WarehouseMaterial | null>(null);
  const [isUpdatingMaterial, setIsUpdatingMaterial] = useState(false);
  const [newMaterialData, setNewMaterialData] = useState({
    materialId: "",
    quantity: 0,
    locationAdjustment: 0,
  });

  // Load materials and warehouse materials
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load available materials from pricing system
        const materialsResponse = await fetch('/api/pricing?category=materials');
        if (materialsResponse.ok) {
          const materialsResult = await materialsResponse.json();
          if (materialsResult.success) {
            setMaterials(materialsResult.data);
          }
        }

        // Load warehouse materials from API
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        
      } catch (error) {
        console.error('Failed to load materials:', error);
        toast.error("Failed to load materials");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [warehouse.id]);

  const handleAddMaterial = async () => {
    try {
      if (!newMaterialData.materialId || newMaterialData.quantity <= 0) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Add material to warehouse via API
      const response = await fetch(`/api/warehouses/${warehouse.id}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterialData),
      });

      if (response.ok) {
        toast.success("Material added successfully");
        setShowAddDialog(false);
        setNewMaterialData({ materialId: "", quantity: 0, locationAdjustment: 0 });
        // Reload warehouse materials
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add material");
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error("Failed to add material");
    }
  };

  const handleUpdateMaterial = async (material: WarehouseMaterial) => {
    setIsUpdatingMaterial(true);
    try {
      // Update warehouse material via API
      const response = await fetch(`/api/warehouses/${warehouse.id}/materials/${material.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: material.quantity,
          locationAdjustment: material.locationAdjustment,
          isActive: material.isActive,
        }),
      });

      if (response.ok) {
        toast.success("Material updated successfully");
        setEditingMaterial(null);
        // Reload warehouse materials
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update material");
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error("Failed to update material");
    } finally {
      setIsUpdatingMaterial(false);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      // Remove material from warehouse via API
      const response = await fetch(`/api/warehouses/${warehouse.id}/materials/${materialId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Material removed successfully");
        // Reload warehouse materials
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove material");
      }
    } catch (error) {
      console.error('Error removing material:', error);
      toast.error("Failed to remove material");
    }
  };

  const selectedMaterial = materials.find(m => m.id === newMaterialData.materialId);
  const adjustedPrice = selectedMaterial 
    ? selectedMaterial.price * (1 + newMaterialData.locationAdjustment / 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{warehouse.name} - Materials & Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Manage available materials and set location-specific pricing adjustments
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{warehouse.name} - Materials & Pricing</h3>
          <p className="text-sm text-muted-foreground">
            Manage available materials and set location-specific pricing adjustments
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Material to Warehouse</DialogTitle>
              <DialogDescription>
                Select a material from your catalog and set location-specific pricing
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="material">Material</Label>
                <Select value={newMaterialData.materialId} onValueChange={(value) => 
                  setNewMaterialData({ ...newMaterialData, materialId: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.label} - ₱{material.price.toLocaleString()}/{material.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMaterial && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div><strong>Base Price:</strong> ₱{selectedMaterial.price.toLocaleString()}/{selectedMaterial.unit}</div>
                    <div><strong>Category:</strong> {selectedMaterial.category}</div>
                    {selectedMaterial.description && (
                      <div><strong>Description:</strong> {selectedMaterial.description}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="quantity">Initial Stock Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={newMaterialData.quantity}
                  onChange={(e) => setNewMaterialData({ 
                    ...newMaterialData, 
                    quantity: parseInt(e.target.value) || 0 
                  })}
                  placeholder="Enter initial stock quantity"
                />
              </div>

              <div>
                <Label htmlFor="adjustment">Location Price Adjustment (%)</Label>
                <Input
                  id="adjustment"
                  type="number"
                  step="0.1"
                  value={newMaterialData.locationAdjustment}
                  onChange={(e) => setNewMaterialData({ 
                    ...newMaterialData, 
                    locationAdjustment: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="e.g., 5 for 5% increase"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Positive values increase price, negative values decrease price
                </p>
              </div>

              {selectedMaterial && newMaterialData.locationAdjustment !== 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <strong>Adjusted Price:</strong> ₱{adjustedPrice.toLocaleString()}/{selectedMaterial.unit}
                    <span className="text-blue-600 ml-2">
                      ({newMaterialData.locationAdjustment > 0 ? '+' : ''}{newMaterialData.locationAdjustment}%)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddMaterial} className="flex-1">
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Materials</CardTitle>
            <CardDescription>
              {warehouseMaterials.length} materials currently stocked at this location
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warehouseMaterials.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {warehouseMaterials.map((warehouseMaterial) => (
                  <div key={warehouseMaterial.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{warehouseMaterial.material.label}</h4>
                      <Badge variant={warehouseMaterial.isActive ? "default" : "secondary"}>
                        {warehouseMaterial.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div><strong>Stock:</strong> {warehouseMaterial.quantity} units</div>
                      <div><strong>Base Price:</strong> ₱{warehouseMaterial.material.price.toLocaleString()}/{warehouseMaterial.material.unit}</div>
                      <div><strong>Location Adjustment:</strong> 
                        <span className={warehouseMaterial.locationAdjustment >= 0 ? "text-green-600" : "text-red-600"}>
                          {warehouseMaterial.locationAdjustment > 0 ? '+' : ''}{warehouseMaterial.locationAdjustment}%
                        </span>
                      </div>
                      <div><strong>Final Price:</strong> 
                        <span className="font-medium text-green-600">
                          ₱{(warehouseMaterial.material.price * (1 + warehouseMaterial.locationAdjustment / 100)).toLocaleString()}/{warehouseMaterial.material.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingMaterial(warehouseMaterial)}
                      >
                        <EditIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveMaterial(warehouseMaterial.id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No materials added yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Add materials from your catalog and set location-specific pricing adjustments
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Material
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Catalog</CardTitle>
            <CardDescription>
              Available materials that can be added to this warehouse location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <div key={material.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{material.label}</h4>
                    <Badge variant="outline">{material.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Price:</strong> ₱{material.price.toLocaleString()}/{material.unit}</div>
                    {material.description && (
                      <div className="text-xs">{material.description}</div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setNewMaterialData({
                        materialId: material.id,
                        quantity: 0,
                        locationAdjustment: 0,
                      });
                      setShowAddDialog(true);
                    }}
                    className="w-full"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add to Warehouse
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Material Dialog */}
      {editingMaterial && (
        <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
              <DialogDescription>
                Update stock quantity and pricing for {editingMaterial.material.label}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-quantity">Stock Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editingMaterial.quantity}
                  onChange={(e) => setEditingMaterial({
                    ...editingMaterial,
                    quantity: parseInt(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <Label htmlFor="edit-adjustment">Location Price Adjustment (%)</Label>
                <Input
                  id="edit-adjustment"
                  type="number"
                  step="0.1"
                  value={editingMaterial.locationAdjustment}
                  onChange={(e) => setEditingMaterial({
                    ...editingMaterial,
                    locationAdjustment: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editingMaterial.isActive}
                  onCheckedChange={(checked) => setEditingMaterial({
                    ...editingMaterial,
                    isActive: checked
                  })}
                />
                <Label htmlFor="edit-active">Active in this warehouse</Label>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <strong>Final Price:</strong> ₱{(editingMaterial.material.price * (1 + editingMaterial.locationAdjustment / 100)).toLocaleString()}/{editingMaterial.material.unit}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleUpdateMaterial(editingMaterial)} 
                  className="flex-1"
                  disabled={isUpdatingMaterial}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isUpdatingMaterial ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditingMaterial(null)}>
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
