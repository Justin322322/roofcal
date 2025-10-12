"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  XIcon,
  GripVerticalIcon,
  PackageIcon,
  SearchIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Warehouse } from "./types";
import dynamic from "next/dynamic";

const StockBalancer = dynamic(() => import("./StockBalancer"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

interface Material {
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

interface MaterialDragDropManagerProps {
  warehouse: Warehouse;
  warehouses: Warehouse[];
  onUpdate: () => void;
  onChangeWarehouse?: () => void;
  onMaterialsUpdate?: (materials: WarehouseMaterial[]) => void;
  onWarehouseUpdate?: () => void;
  onMaterialsRefresh?: () => void;
}

interface DraggableMaterial extends Material {
  isInWarehouse?: boolean;
  warehouseMaterialId?: string;
}

function DraggableMaterialRow({ 
  material, 
  isSelected, 
  onSelect, 
  onEdit,
  isInWarehouse = false 
}: { 
  material: DraggableMaterial;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit?: (material: DraggableMaterial) => void;
  isInWarehouse?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: material.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg' : ''} ${isInWarehouse ? 'bg-blue-50' : ''}`}
    >
      <TableCell className="w-8">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVerticalIcon className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(material.id, !!checked)}
          disabled={isInWarehouse}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {material.label}
          {isInWarehouse && (
            <Badge variant="secondary" className="text-xs">
              In Warehouse
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{material.category}</Badge>
      </TableCell>
      <TableCell>
        ₱{material.price.toLocaleString()}/{material.unit}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
        {material.description || 'No description'}
      </TableCell>
      <TableCell className="w-16">
        {onEdit && !isInWarehouse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(material)}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function WarehouseMaterialRow({ 
  material, 
  onEdit, 
  onRemove,
  isSelected,
  onSelect
}: { 
  material: WarehouseMaterial;
  onEdit: (material: WarehouseMaterial) => void;
  onRemove: (materialId: string) => void;
  isSelected: boolean;
  onSelect: (materialId: string) => void;
}) {
  const finalPrice = material.material.price * (1 + material.locationAdjustment / 100);

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(material.id)}
        />
      </TableCell>
      <TableCell className="font-medium">{material.material.label}</TableCell>
      <TableCell>
        <Badge variant="outline">{material.material.category}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {material.quantity} units
      </TableCell>
      <TableCell>
        ₱{material.material.price.toLocaleString()}/{material.material.unit}
      </TableCell>
      <TableCell className="text-right">
        <span className={material.locationAdjustment >= 0 ? "text-green-600" : "text-red-600"}>
          {material.locationAdjustment > 0 ? '+' : ''}{material.locationAdjustment}%
        </span>
      </TableCell>
      <TableCell className="text-right font-medium">
        ₱{finalPrice.toLocaleString()}/{material.material.unit}
      </TableCell>
      <TableCell>
        <Badge variant={material.isActive ? "default" : "secondary"}>
          {material.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(material)}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onRemove(material.id)}
              className="text-red-600 focus:text-red-600"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function MaterialDragDropManager({ warehouse, warehouses, onUpdate, onChangeWarehouse, onMaterialsUpdate, onWarehouseUpdate, onMaterialsRefresh }: MaterialDragDropManagerProps) {
  const [materials, setMaterials] = useState<DraggableMaterial[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<WarehouseMaterial[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [selectedWarehouseMaterials, setSelectedWarehouseMaterials] = useState<Set<string>>(new Set());
  const [editingWarehouseMaterial, setEditingWarehouseMaterial] = useState<WarehouseMaterial | null>(null);
  const [isUpdatingWarehouseMaterial, setIsUpdatingWarehouseMaterial] = useState(false);
  const [isAddingMaterials, setIsAddingMaterials] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMaterialData, setNewMaterialData] = useState({
    quantity: 1,
    locationAdjustment: 0,
  });
  const [bulkMaterialData, setBulkMaterialData] = useState<Record<string, { quantity: number; locationAdjustment: number }>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load materials and warehouse materials
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available materials from pricing system
        const materialsResponse = await fetch('/api/pricing');
        if (materialsResponse.ok) {
          const materialsResult = await materialsResponse.json();
          if (materialsResult.success) {
            setMaterials(materialsResult.data);
          }
        }

        // Load warehouse materials
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          console.log('Warehouse materials loaded:', warehouseMaterialsResult);
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
            onMaterialsUpdate?.(warehouseMaterialsResult.data);
          }
        } else {
          console.error('Failed to load warehouse materials:', warehouseMaterialsResponse.status);
        }
        
      } catch (error) {
        console.error('Failed to load materials:', error);
        toast.error("Failed to load materials");
      }
    };

    loadData();
  }, [warehouse.id, onMaterialsUpdate]);

  // Mark materials that are already in warehouse (only active ones)
  const materialsWithStatus = useMemo(() => {
    const activeWarehouseMaterialIds = new Set(
      warehouseMaterials.filter(wm => wm.isActive).map(wm => wm.materialId)
    );
    return materials.map(material => ({
      ...material,
      isInWarehouse: activeWarehouseMaterialIds.has(material.id),
      warehouseMaterialId: warehouseMaterials.find(wm => wm.materialId === material.id && wm.isActive)?.id,
    }));
  }, [materials, warehouseMaterials]);

  // Available materials (not in warehouse)
  const availableMaterials = useMemo(() => 
    materialsWithStatus.filter(m => !m.isInWarehouse),
    [materialsWithStatus]
  );

  // Active warehouse materials only
  const activeWarehouseMaterials = useMemo(() => 
    warehouseMaterials.filter(wm => wm.isActive),
    [warehouseMaterials]
  );

  // Pagination logic
  const totalPages = Math.ceil(availableMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMaterials = availableMaterials.slice(startIndex, endIndex);

  // Reset to first page when materials change
  useEffect(() => {
    setCurrentPage(1);
  }, [availableMaterials.length]);

  const handleSelectMaterial = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedMaterials);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedMaterials(newSelected);
  };

  const handleSelectAll = () => {
    const allAvailableMaterials = availableMaterials.map(m => m.id);
    const allSelected = allAvailableMaterials.every(id => selectedMaterials.has(id));
    
    if (allSelected) {
      // Deselect all materials
      setSelectedMaterials(new Set());
    } else {
      // Select all available materials
      setSelectedMaterials(new Set(allAvailableMaterials));
    }
  };

  const handleDragStart = () => {
    // Optional: Add visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'warehouse-drop-zone') {
      // Add dragged material to warehouse
      const draggedMaterial = materialsWithStatus.find(m => m.id === active.id);
      if (draggedMaterial && !draggedMaterial.isInWarehouse) {
        setSelectedMaterials(new Set([draggedMaterial.id]));
        setNewMaterialData({ quantity: 1, locationAdjustment: 0 });
        setShowAddDialog(true);
      }
    }
  };

  const handleAddSelectedMaterials = () => {
    if (selectedMaterials.size === 0) {
      toast.error("Please select materials to add");
      return;
    }
    
    // Initialize bulk material data with default values
    const initialBulkData: Record<string, { quantity: number; locationAdjustment: number }> = {};
    selectedMaterials.forEach(materialId => {
      initialBulkData[materialId] = { quantity: 1, locationAdjustment: 0 };
    });
    setBulkMaterialData(initialBulkData);
    
    setShowAddDialog(true);
  };

  const handleAddMaterials = async () => {
    setIsAddingMaterials(true);
    try {
      const materialsToAdd = Array.from(selectedMaterials);
      
      // Validate quantities
      if (materialsToAdd.length === 1) {
        if (newMaterialData.quantity <= 0) {
          toast.error("Please enter a quantity greater than 0");
          setIsAddingMaterials(false);
          return;
        }
      } else {
        const invalidMaterials = materialsToAdd.filter(materialId => {
          const materialData = bulkMaterialData[materialId] || { quantity: 1, locationAdjustment: 0 };
          return materialData.quantity <= 0;
        });
        
        if (invalidMaterials.length > 0) {
          toast.error("Please enter quantities greater than 0 for all materials");
          setIsAddingMaterials(false);
          return;
        }
      }

      // Check warehouse capacity using volume calculations
      const currentVolumeUsed = warehouseMaterials.reduce((sum, m) => {
        let unitVolume = 1;
        if (m.material.volume && m.material.volume > 0) {
          unitVolume = m.material.volume;
        } else if (m.material.length && m.material.width && m.material.height) {
          unitVolume = m.material.length * m.material.width * m.material.height;
        }
        return sum + (m.quantity * unitVolume);
      }, 0);
      
      let totalNewVolume = 0;
      
      if (materialsToAdd.length === 1) {
        const material = materialsWithStatus.find(m => m.id === materialsToAdd[0]);
        if (material) {
          let unitVolume = 1;
          if (material.volume && material.volume > 0) {
            unitVolume = material.volume;
          } else if (material.length && material.width && material.height) {
            unitVolume = material.length * material.width * material.height;
          }
          totalNewVolume = newMaterialData.quantity * unitVolume;
        }
      } else {
        totalNewVolume = materialsToAdd.reduce((sum, materialId) => {
          const material = materialsWithStatus.find(m => m.id === materialId);
          const materialData = bulkMaterialData[materialId] || { quantity: 1 };
          if (material) {
            let unitVolume = 1;
            if (material.volume && material.volume > 0) {
              unitVolume = material.volume;
            } else if (material.length && material.width && material.height) {
              unitVolume = material.length * material.width * material.height;
            }
            return sum + (materialData.quantity * unitVolume);
          }
          return sum + materialData.quantity;
        }, 0);
      }
      
      const totalCapacity = warehouse.capacity || 0;
      
      if (totalCapacity > 0 && (currentVolumeUsed + totalNewVolume) > totalCapacity) {
        const availableCapacity = totalCapacity - currentVolumeUsed;
        toast.error("Warehouse capacity exceeded", {
          description: `Cannot add ${totalNewVolume.toFixed(2)} m³. Only ${availableCapacity.toFixed(2)} m³ of capacity remaining. Consider using the stock balancer to redistribute materials.`,
        });
        setIsAddingMaterials(false);
        return;
      }
      
      if (materialsToAdd.length === 1) {
        // Single material - use the form data
        const material = materialsWithStatus.find(m => m.id === materialsToAdd[0]);
        if (!material) return;

        const response = await fetch(`/api/warehouses/${warehouse.id}/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId: material.id,
            quantity: newMaterialData.quantity,
            locationAdjustment: newMaterialData.locationAdjustment,
          }),
        });

        if (response.ok) {
          toast.success(`${material.label} added successfully`);
        } else {
          const error = await response.json();
          console.error('Error adding material:', {
            materialId: material.id,
            materialLabel: material.label,
            status: response.status,
            error: error
          });
          toast.error(error.error || error.message || "Failed to add material");
        }
      } else {
        // Multiple materials - add with individual values
        const promises = materialsToAdd.map(materialId => {
          const material = materialsWithStatus.find(m => m.id === materialId);
          if (!material) return Promise.resolve();

          const materialData = bulkMaterialData[materialId] || { quantity: 1, locationAdjustment: 0 };

          return fetch(`/api/warehouses/${warehouse.id}/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              materialId: material.id,
              quantity: materialData.quantity,
              locationAdjustment: materialData.locationAdjustment,
            }),
          });
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r && r.ok).length;
        
        // Log failed requests for debugging
        results.forEach(async (result, index) => {
          if (result && !result.ok) {
            try {
              const errorData = await result.json();
              console.error(`Failed to add material ${materialsToAdd[index]}:`, {
                status: result.status,
                error: errorData
              });
            } catch {
              console.error(`Failed to add material ${materialsToAdd[index]}:`, result.status);
            }
          }
        });
        
        toast.success(`${successCount} materials added successfully`);
      }

      // Reload data
      const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
      if (warehouseMaterialsResponse.ok) {
        const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
        if (warehouseMaterialsResult.success) {
          setWarehouseMaterials(warehouseMaterialsResult.data);
          onMaterialsUpdate?.(warehouseMaterialsResult.data);
        }
      }

      setShowAddDialog(false);
      setSelectedMaterials(new Set());
      setNewMaterialData({ quantity: 1, locationAdjustment: 0 });
      setBulkMaterialData({});
      onUpdate();
      onMaterialsRefresh?.(); // Trigger refresh of parent component's warehouse materials
    } catch (error) {
      console.error('Error adding materials:', error);
      toast.error("Failed to add materials");
    } finally {
      setIsAddingMaterials(false);
    }
  };

  const handleUpdateWarehouseMaterial = async (material: WarehouseMaterial) => {
    setIsUpdatingWarehouseMaterial(true);
    try {
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
        // Reload data
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        setEditingWarehouseMaterial(null);
        onUpdate();
        onMaterialsRefresh?.(); // Trigger refresh of parent component's warehouse materials
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update material");
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error("Failed to update material");
    } finally {
      setIsUpdatingWarehouseMaterial(false);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      const response = await fetch(`/api/warehouses/${warehouse.id}/materials/${materialId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Material removed successfully");
        // Reload data
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        onUpdate();
        onMaterialsRefresh?.(); // Trigger refresh of parent component's warehouse materials
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove material");
      }
    } catch (error) {
      console.error('Error removing material:', error);
      toast.error("Failed to remove material");
    }
  };

  const handleBulkRemoveMaterials = async () => {
    if (selectedWarehouseMaterials.size === 0) return;
    
    try {
      const promises = Array.from(selectedWarehouseMaterials).map(materialId =>
        fetch(`/api/warehouses/${warehouse.id}/materials/${materialId}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} material${successCount > 1 ? 's' : ''} removed successfully`);
        // Reload data
        const warehouseMaterialsResponse = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (warehouseMaterialsResponse.ok) {
          const warehouseMaterialsResult = await warehouseMaterialsResponse.json();
          if (warehouseMaterialsResult.success) {
            setWarehouseMaterials(warehouseMaterialsResult.data);
          }
        }
        setSelectedWarehouseMaterials(new Set());
        onUpdate();
        onMaterialsRefresh?.(); // Trigger refresh of parent component's warehouse materials
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} material${failedCount > 1 ? 's' : ''} failed to remove`);
      }
    } catch (error) {
      console.error('Error removing materials:', error);
      toast.error("Failed to remove materials");
    }
  };

  const handleSelectAllWarehouseMaterials = () => {
    if (selectedWarehouseMaterials.size === activeWarehouseMaterials.length) {
      setSelectedWarehouseMaterials(new Set());
    } else {
      setSelectedWarehouseMaterials(new Set(activeWarehouseMaterials.map(m => m.id)));
    }
  };

  const handleToggleWarehouseMaterial = (materialId: string) => {
    const newSelected = new Set(selectedWarehouseMaterials);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedWarehouseMaterials(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Warehouse Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PackageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {warehouse.address}, {warehouse.city}, {warehouse.state}
                </p>
                {warehouse.capacity && warehouse.capacity > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Capacity: {warehouse.capacity.toFixed(2)} m³
                    </p>
                    {(() => {
                      const currentVolumeUsed = warehouseMaterials.reduce((sum, m) => {
                        let unitVolume = 1;
                        if (m.material.volume && m.material.volume > 0) {
                          unitVolume = m.material.volume;
                        } else if (m.material.length && m.material.width && m.material.height) {
                          unitVolume = m.material.length * m.material.width * m.material.height;
                        }
                        return sum + (m.quantity * unitVolume);
                      }, 0);
                      const utilization = (currentVolumeUsed / warehouse.capacity) * 100;
                      
                      if (utilization >= 90) {
                        return (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-red-600">Critical: {utilization.toFixed(1)}% full</span>
                          </div>
                        );
                      } else if (utilization >= 75) {
                        return (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-yellow-600">Warning: {utilization.toFixed(1)}% full</span>
                          </div>
                        );
                      } else if (utilization >= 50) {
                        return (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-orange-600">Moderate: {utilization.toFixed(1)}% full</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-green-600">Good: {utilization.toFixed(1)}% full</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <StockBalancer 
                warehouses={warehouses}
                onWarehouseUpdate={onWarehouseUpdate || (() => {})}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onChangeWarehouse}
              >
                Change Warehouse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Material Catalog Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Material Catalog</CardTitle>
                <CardDescription>
                  Available materials that can be added to {warehouse.name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {availableMaterials.every(m => selectedMaterials.has(m.id)) ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddSelectedMaterials}
                  disabled={selectedMaterials.size === 0}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Selected ({selectedMaterials.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {availableMaterials.length === 0 ? (
              <div className="text-center py-12">
                <PackageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Materials Available</h3>
                <p className="text-muted-foreground">
                  All materials have been added to this warehouse.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext items={paginatedMaterials.map(m => m.id)} strategy={verticalListSortingStrategy}>
                      {paginatedMaterials.map((material) => (
                        <DraggableMaterialRow
                          key={material.id}
                          material={material}
                          isSelected={selectedMaterials.has(material.id)}
                          onSelect={handleSelectMaterial}
                          isInWarehouse={false}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {availableMaterials.length > itemsPerPage && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, availableMaterials.length)} of {availableMaterials.length} materials
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warehouse Materials Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Warehouse Materials</CardTitle>
                <CardDescription>
                  Materials currently stocked at {warehouse.name}
                </CardDescription>
              </div>
              {selectedWarehouseMaterials.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkRemoveMaterials}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Remove Selected ({selectedWarehouseMaterials.size})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data Table */}
            {activeWarehouseMaterials.length === 0 ? (
              <div className="text-center py-12">
                <PackageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Materials Added</h3>
                <p className="text-muted-foreground">
                  Add materials from the catalog above to get started with inventory management.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={selectedWarehouseMaterials.size === activeWarehouseMaterials.length && activeWarehouseMaterials.length > 0}
                          onCheckedChange={handleSelectAllWarehouseMaterials}
                        />
                      </TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead className="text-right">Adjustment</TableHead>
                      <TableHead className="text-right">Final Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWarehouseMaterials.map((material) => (
                      <WarehouseMaterialRow
                        key={material.id}
                        material={material}
                        onEdit={setEditingWarehouseMaterial}
                        onRemove={handleRemoveMaterial}
                        isSelected={selectedWarehouseMaterials.has(material.id)}
                        onSelect={handleToggleWarehouseMaterial}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <DragOverlay>
          {/* Optional: Add drag overlay content */}
        </DragOverlay>
      </DndContext>

       {/* Add Materials Dialog */}
       {showAddDialog && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add {selectedMaterials.size === 1 ? 'Material' : 'Materials'} to Warehouse
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddDialog(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            {selectedMaterials.size === 1 ? (
              <div className="space-y-4">
                {(() => {
                  const material = materialsWithStatus.find(m => m.id === Array.from(selectedMaterials)[0]);
                  if (!material) return null;
                  
                  return (
                    <>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm space-y-1">
                          <div><strong>Material:</strong> {material.label}</div>
                          <div><strong>Base Price:</strong> ₱{material.price.toLocaleString()}/{material.unit}</div>
                          <div><strong>Category:</strong> {material.category}</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Initial Stock Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={newMaterialData.quantity}
                          onChange={(e) => setNewMaterialData({
                            ...newMaterialData, 
                            quantity: parseInt(e.target.value) || 1 
                          })}
                          placeholder="Enter initial stock quantity (minimum 1)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Location Price Adjustment (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newMaterialData.locationAdjustment}
                          onChange={(e) => setNewMaterialData({ 
                            ...newMaterialData, 
                            locationAdjustment: parseFloat(e.target.value) || 0 
                          })}
                          placeholder="e.g., 5 for 5% increase"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
             ) : (
               <div className="space-y-4">
                 <div className="p-3 bg-blue-50 rounded-lg">
                   <div className="flex items-center gap-2">
                     <span className="font-semibold text-gray-900">{selectedMaterials.size} materials selected</span>
                   </div>
                   <p className="text-sm text-gray-600 mt-1">
                     Configure stock quantity and price adjustment for each material (optional)
                   </p>
                 </div>
                 
                 <div className="border rounded-lg">
                   <div className="bg-gray-50 px-4 py-2 border-b">
                     <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
                       <div className="col-span-6">Material</div>
                       <div className="col-span-3 text-center">Stock Qty</div>
                       <div className="col-span-3 text-center">Price Adj (%)</div>
                     </div>
                   </div>
                   <div className="max-h-64 overflow-y-auto">
                     {Array.from(selectedMaterials).map(materialId => {
                       const material = materialsWithStatus.find(m => m.id === materialId);
                       if (!material) return null;
                       
                       const materialData = bulkMaterialData[materialId] || { quantity: 1, locationAdjustment: 0 };
                       
                       return (
                         <div key={materialId} className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                           <div className="col-span-6">
                             <div className="font-medium text-sm">{material.label}</div>
                             <div className="text-xs text-gray-500">{material.category}</div>
                           </div>
                           <div className="col-span-3">
                             <Input
                               type="number"
                               min="1"
                               required
                               value={materialData.quantity}
                               onChange={(e) => setBulkMaterialData({
                                 ...bulkMaterialData,
                                 [materialId]: {
                                   ...materialData,
                                   quantity: parseInt(e.target.value) || 1
                                 }
                               })}
                               placeholder="0"
                               className="h-8 text-sm text-center"
                             />
                           </div>
                           <div className="col-span-3">
                             <Input
                               type="number"
                               step="0.1"
                               value={materialData.locationAdjustment}
                               onChange={(e) => setBulkMaterialData({
                                 ...bulkMaterialData,
                                 [materialId]: {
                                   ...materialData,
                                   locationAdjustment: parseFloat(e.target.value) || 0
                                 }
                               })}
                               placeholder="0"
                               className="h-8 text-sm text-center"
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               </div>
             )}

            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleAddMaterials} 
                className="flex-1"
                disabled={isAddingMaterials}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isAddingMaterials ? "Adding..." : `Add ${selectedMaterials.size === 1 ? 'Material' : 'Materials'}`}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Warehouse Material Dialog */}
      {editingWarehouseMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Material</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingWarehouseMaterial(null)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Material:</strong> {editingWarehouseMaterial.material.label}</div>
                  <div><strong>Base Price:</strong> ₱{editingWarehouseMaterial.material.price.toLocaleString()}/{editingWarehouseMaterial.material.unit}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={editingWarehouseMaterial.quantity}
                  onChange={(e) => setEditingWarehouseMaterial({
                    ...editingWarehouseMaterial,
                    quantity: parseInt(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location Price Adjustment (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingWarehouseMaterial.locationAdjustment}
                  onChange={(e) => setEditingWarehouseMaterial({
                    ...editingWarehouseMaterial,
                    locationAdjustment: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingWarehouseMaterial.isActive}
                    onChange={(e) => setEditingWarehouseMaterial({
                      ...editingWarehouseMaterial,
                      isActive: e.target.checked
                    })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Active in warehouse</span>
                </label>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <strong>Final Price:</strong> ₱{(editingWarehouseMaterial.material.price * (1 + editingWarehouseMaterial.locationAdjustment / 100)).toLocaleString()}/{editingWarehouseMaterial.material.unit}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => handleUpdateWarehouseMaterial(editingWarehouseMaterial)} 
                className="flex-1"
                disabled={isUpdatingWarehouseMaterial}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isUpdatingWarehouseMaterial ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditingWarehouseMaterial(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
