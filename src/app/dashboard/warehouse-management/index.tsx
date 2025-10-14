"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  WarehouseIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  AlertCircleIcon,
  EditIcon,
} from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import { RadialBarChart, RadialBar, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Dynamic imports for Leaflet maps to avoid SSR issues
const WarehouseCardMap = dynamic(() => import("./WarehouseCardMap"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

const FullScreenMapModal = dynamic(() => import("./FullScreenMapModal"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});


// Import types and components
import { Warehouse } from "./types";
import { MaterialDragDropManager } from "./MaterialDragDropManager";
import { WarehouseMaterialWarnings } from "@/components/warehouse-material-warnings";

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

// Global cache for warehouse data
let globalWarehouseCache: Warehouse[] | null = null;
let globalWarehouseLoading = false;
let globalWarehouseHasFetched = false;

// Global cache for warehouse materials
const globalWarehouseMaterialsCache: Record<string, WarehouseMaterial[]> = {};

// Custom hook to manage warehouse data with global caching
function useWarehouseData() {
  const { data: session } = useSession();
  const [warehouses, setWarehouses] = useState<Warehouse[]>(globalWarehouseCache || []);
  const [loading, setLoading] = useState(globalWarehouseLoading);
  const hasFetched = useRef(globalWarehouseHasFetched);

  const fetchWarehouses = async () => {
    if (globalWarehouseLoading) return [];

    globalWarehouseLoading = true;
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/warehouses");
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched warehouses data:', data);
        const fetchedWarehouses = data.data || [];
        setWarehouses(fetchedWarehouses);
        globalWarehouseCache = fetchedWarehouses;
        return fetchedWarehouses;
      } else {
        // For now, set empty array until API is implemented
        setWarehouses([]);
        globalWarehouseCache = [];
        return [];
      }
    } catch {
      // For now, set empty array until API is implemented
      setWarehouses([]);
      globalWarehouseCache = [];
      return [];
    } finally {
      setLoading(false);
      globalWarehouseLoading = false;
    }
  };

  useEffect(() => {
    if (session?.user?.id && (session.user.role === "ADMIN" || session.user.role === "CLIENT")) {
      if (!hasFetched.current) {
        hasFetched.current = true;
        globalWarehouseHasFetched = true;
        fetchWarehouses();
      } else if (globalWarehouseCache) {
        setWarehouses(globalWarehouseCache);
        setLoading(false);
      }
    } else if (session === null) {
      globalWarehouseCache = null;
      globalWarehouseHasFetched = false;
      hasFetched.current = false;
      setWarehouses([]);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session]);

  return { warehouses, loading, fetchWarehouses };
}


// Warehouse Edit Form Component
function WarehouseEditForm({ 
  warehouse, 
  onSave, 
  onCancel 
}: { 
  warehouse: Warehouse;
  onSave: (warehouse: Partial<Warehouse>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: warehouse.name,
    street: warehouse.address.split(',')[0] || '',
    barangay: warehouse.address.split(',')[1]?.trim() || '',
    city: warehouse.city,
    province: warehouse.state,
    postalCode: warehouse.zipCode,
    length: warehouse.length || 0,
    width: warehouse.width || 0,
    height: warehouse.height || 0,
    capacity: warehouse.capacity || 0
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Format address in Philippine standard format
      const address = `${formData.street}, ${formData.barangay}`;
      
      // Calculate capacity from dimensions: Capacity = Length × Width × Height
      const calculatedCapacity = formData.length && formData.width && formData.height 
        ? formData.length * formData.width * formData.height 
        : formData.capacity;

      // Create warehouse data matching Prisma schema
      const warehouseData = {
        name: formData.name,
        address: address,
        city: formData.city,
        state: formData.province,
        zipCode: formData.postalCode,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        capacity: calculatedCapacity,
      };
      
      const response = await fetch(`/api/warehouses/${warehouse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warehouseData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Warehouse updated successfully:', result);
        onSave(result.data);
      } else {
        const error = await response.json();
        console.error('Failed to update warehouse:', error);
      }
    } catch (error) {
      console.error('Error updating warehouse:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Warehouse Name</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter warehouse name"
          required
        />
      </div>
      
      <div className="relative z-10">
        <Label htmlFor="edit-street">Street Address</Label>
        <Input
          id="edit-street"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          placeholder="e.g., 123 Main Street, Building Name"
          required
          className="relative z-10"
        />
      </div>
      
      <div className="relative z-10">
        <Label htmlFor="edit-barangay">Barangay</Label>
        <Input
          id="edit-barangay"
          value={formData.barangay}
          onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
          placeholder="e.g., Barangay Name"
          required
          className="relative z-10"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div>
          <Label htmlFor="edit-city">City/Municipality</Label>
          <Input
            id="edit-city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g., Balanga"
            required
            className="relative z-10"
          />
        </div>
        
        <div>
          <Label htmlFor="edit-province">Province</Label>
          <Input
            id="edit-province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            placeholder="e.g., Bataan"
            required
            className="relative z-10"
          />
        </div>
      </div>
      
      <div className="relative z-10">
        <Label htmlFor="edit-postalCode">Postal Code</Label>
        <Input
          id="edit-postalCode"
          value={formData.postalCode}
          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          placeholder="e.g., 2100"
          required
          className="relative z-10"
        />
      </div>
      
      <div className="relative z-10">
        <Label className="text-base font-semibold">Warehouse Dimensions (in meters)</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the warehouse dimensions to calculate storage capacity
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="edit-length">Length (m)</Label>
            <Input
              id="edit-length"
              type="number"
              step="0.1"
              min="0"
              value={formData.length || ''}
              onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 50.0"
              className="relative z-10"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-width">Width (m)</Label>
            <Input
              id="edit-width"
              type="number"
              step="0.1"
              min="0"
              value={formData.width || ''}
              onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 30.0"
              className="relative z-10"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-height">Height (m)</Label>
            <Input
              id="edit-height"
              type="number"
              step="0.1"
              min="0"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 6.0"
              className="relative z-10"
            />
          </div>
        </div>
        
        {/* Display calculated capacity */}
        {formData.length > 0 && formData.width > 0 && formData.height > 0 && (
          <div className="mt-3 p-3 bg-muted rounded-lg border">
            <div className="text-sm">
              <span className="font-medium text-foreground">Calculated Capacity:</span>
              <span className="ml-2 text-primary font-semibold">
                {(formData.length * formData.width * formData.height).toFixed(2)} m³
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Formula: Length × Width × Height = {formData.length} × {formData.width} × {formData.height}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isUpdating}>
          <EditIcon className="h-4 w-4 mr-2" />
          {isUpdating ? "Updating..." : "Update Warehouse"}
        </Button>
      </div>
    </form>
  );
}

// Warehouse Setup Form Component
function WarehouseSetupForm({ onSave }: { onSave: (warehouse: Partial<Warehouse>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    length: 0,
    width: 0,
    height: 0,
    capacity: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format address in Philippine standard format
      const address = `${formData.street}, ${formData.barangay}`;
      
      // Calculate capacity from dimensions: Capacity = Length × Width × Height
      const calculatedCapacity = formData.length && formData.width && formData.height 
        ? formData.length * formData.width * formData.height 
        : formData.capacity;

      // Create warehouse data matching Prisma schema
      const warehouseData = {
        name: formData.name,
        address: address,
        city: formData.city,
        state: formData.province, // Using 'state' field for province
        zipCode: formData.postalCode,
        latitude: 14.6760, // Default coordinates for Balanga, Bataan
        longitude: 120.5361,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        capacity: calculatedCapacity,
        isDefault: false
      };
      
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warehouseData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Warehouse created successfully:', result);
        onSave(result.data);
        setFormData({ 
          name: '', 
          street: '', 
          barangay: '', 
          city: '', 
          province: '', 
          postalCode: '', 
          length: 0,
          width: 0,
          height: 0,
          capacity: 0
        });
      } else {
        const error = await response.json();
        console.error('Failed to create warehouse:', error);
      }
    } catch (error) {
      console.error('Error creating warehouse:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Warehouse Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter warehouse name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          placeholder="e.g., 123 Main Street, Building Name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="barangay">Barangay</Label>
        <Input
          id="barangay"
          value={formData.barangay}
          onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
          placeholder="e.g., Barangay Name"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City/Municipality</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g., Balanga"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="province">Province</Label>
          <Input
            id="province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            placeholder="e.g., Bataan"
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input
          id="postalCode"
          value={formData.postalCode}
          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          placeholder="e.g., 2100"
          required
        />
      </div>
      
      <div>
        <Label className="text-base font-semibold">Warehouse Dimensions (in meters)</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the warehouse dimensions to calculate storage capacity
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="length">Length (m)</Label>
            <Input
              id="length"
              type="number"
              step="0.1"
              min="0"
              value={formData.length || ''}
              onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 50.0"
            />
          </div>
          
          <div>
            <Label htmlFor="width">Width (m)</Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              value={formData.width || ''}
              onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 30.0"
            />
          </div>
          
          <div>
            <Label htmlFor="height">Height (m)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              min="0"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 6.0"
            />
          </div>
        </div>
        
        {/* Display calculated capacity */}
        {formData.length > 0 && formData.width > 0 && formData.height > 0 && (
          <div className="mt-3 p-3 bg-muted rounded-lg border">
            <div className="text-sm">
              <span className="font-medium text-foreground">Calculated Capacity:</span>
              <span className="ml-2 text-primary font-semibold">
                {(formData.length * formData.width * formData.height).toFixed(2)} m³
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Formula: Length × Width × Height = {formData.length} × {formData.width} × {formData.height}
            </div>
          </div>
        )}
      </div>
      
      <Button type="submit" className="w-full">
        <PlusIcon className="h-4 w-4 mr-2" />
        Create Warehouse
      </Button>
    </form>
  );
}

export function WarehouseManagementPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { warehouses, fetchWarehouses } = useWarehouseData();
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [allWarehouseMaterials, setAllWarehouseMaterials] = useState<Record<string, WarehouseMaterial[]>>({});
  const [highlightedMaterialIds, setHighlightedMaterialIds] = useState<string[]>([]);
  
  // Function to refresh warehouse materials for a specific warehouse
  const refreshWarehouseMaterials = useCallback(async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}/materials`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const materials = result.data || [];
          globalWarehouseMaterialsCache[warehouseId] = materials;
          // Update the all warehouse materials state
          setAllWarehouseMaterials(prev => ({
            ...prev,
            [warehouseId]: materials
          }));
          return materials;
        }
      }
      return [];
    } catch (error) {
      console.error('Error refreshing warehouse materials:', error);
      return [];
    }
  }, []);

  // Function to refresh materials for all warehouses (for overview tab)
  const refreshAllWarehouseMaterials = useCallback(async () => {
    try {
      const materialsPromises = warehouses.map(async (warehouse) => {
        const response = await fetch(`/api/warehouses/${warehouse.id}/materials`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const materials = result.data || [];
            globalWarehouseMaterialsCache[warehouse.id] = materials;
            return { warehouseId: warehouse.id, materials };
          }
        }
        return { warehouseId: warehouse.id, materials: [] };
      });

      const results = await Promise.all(materialsPromises);
      const materialsMap = results.reduce((acc, { warehouseId, materials }) => {
        acc[warehouseId] = materials;
        return acc;
      }, {} as Record<string, WarehouseMaterial[]>);

      setAllWarehouseMaterials(materialsMap);
      return materialsMap;
    } catch (error) {
      console.error('Error refreshing all warehouse materials:', error);
      return {};
    }
  }, [warehouses]);

  console.log('WarehouseManagementPage - Session:', session);
  console.log('WarehouseManagementPage - User role:', session?.user?.role);

  // Handle URL parameters for auto-selecting warehouse and highlighting materials
  useEffect(() => {
    const warehouseParam = searchParams.get('warehouse');
    const materialsParam = searchParams.get('materials');
    const highlightParam = searchParams.get('highlight');

    if (warehouseParam && warehouses.length > 0) {
      // Find and select the warehouse
      const warehouse = warehouses.find(w => w.id === warehouseParam);
      if (warehouse) {
        setSelectedWarehouse(warehouse);
        setActiveTab("materials");
        
        // If materials are specified and highlight is true, highlight those materials
        if (materialsParam && highlightParam === 'true') {
          const materialIds = materialsParam.split(',');
          setHighlightedMaterialIds(materialIds);
          
          // Show a toast to guide the user
          toast.info("Materials highlighted", {
            description: `${materialIds.length} material(s) need to be updated. Please update their quantities.`,
            duration: 5000,
          });
          
          // Clear the highlight after 10 seconds
          setTimeout(() => {
            setHighlightedMaterialIds([]);
          }, 10000);
        }
      }
    }
  }, [searchParams, warehouses]);

  const handleWarehouseSave = (warehouseData: Partial<Warehouse>) => {
    // The warehouse creation is handled in the form component
    // This function is called after successful creation
    toast.success("Warehouse created successfully", {
      description: `${warehouseData.name} has been added to your warehouses`,
    });
    setShowSetupForm(false);
    fetchWarehouses(); // Refresh data
  };

  const handleWarehouseUpdate = async (warehouseData: Partial<Warehouse>) => {
    toast.success("Warehouse updated successfully", {
      description: `${warehouseData.name} has been updated`,
    });
    setShowEditDialog(false);
    setEditingWarehouse(null);
    
    // Refresh data and get updated warehouses
    const updatedWarehouses = await fetchWarehouses();
    
    // Update selectedWarehouse if it's the one that was updated
    if (selectedWarehouse && selectedWarehouse.id === warehouseData.id) {
      const updatedWarehouse = updatedWarehouses.find((w: Warehouse) => w.id === warehouseData.id);
      if (updatedWarehouse) {
        setSelectedWarehouse(updatedWarehouse);
      }
    }
  };

  const handleEditCancel = () => {
    setShowEditDialog(false);
    setEditingWarehouse(null);
  };

  const handleMaterialsUpdate = useCallback((materials: WarehouseMaterial[]) => {
    // Update the all warehouse materials cache
    if (selectedWarehouse?.id) {
      setAllWarehouseMaterials(prev => ({
        ...prev,
        [selectedWarehouse.id]: materials
      }));
    }
  }, [selectedWarehouse?.id]);

  // Load warehouse materials when selected warehouse changes
  useEffect(() => {
    if (selectedWarehouse?.id) {
      refreshWarehouseMaterials(selectedWarehouse.id);
    }
  }, [selectedWarehouse?.id, refreshWarehouseMaterials]);

  // Load all warehouse materials when warehouses are loaded or when switching to overview tab
  useEffect(() => {
    if (warehouses.length > 0 && activeTab === "overview") {
      refreshAllWarehouseMaterials();
    }
  }, [warehouses, activeTab, refreshAllWarehouseMaterials]);

  // Calculate warning count for tab badge
  const getWarningCount = () => {
    let totalWarnings = 0;
    warehouses.forEach(warehouse => {
      const warehouseMaterials = allWarehouseMaterials[warehouse.id] || [];
      const activeMaterials = warehouseMaterials.filter(m => m.isActive);
      
      activeMaterials.forEach(material => {
        // Skip Labor materials - they are fixed costs, not physical inventory
        if (material.material.category.toLowerCase() === 'labor') {
          return;
        }
        
        const currentStock = material.quantity;
        let warningThreshold = 10;
        let criticalThreshold = 5;
        
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
        
        if (currentStock <= criticalThreshold || currentStock <= warningThreshold) {
          totalWarnings++;
        }
      });
    });
    return totalWarnings;
  };

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "CLIENT") {
    return (
      <div className="px-4 lg:px-6">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This page is only accessible to administrators and contractors.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Manage your warehouses with 2D mapping and inventory tracking
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex flex-col sm:flex-row justify-end gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchWarehouses();
              if (activeTab === "overview") {
                refreshAllWarehouseMaterials();
                // Force multiple refreshes to ensure data is updated
                setTimeout(() => refreshAllWarehouseMaterials(), 100);
                setTimeout(() => refreshAllWarehouseMaterials(), 500);
              }
            }}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Dialog open={showSetupForm} onOpenChange={setShowSetupForm}>
            <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-initial">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Warehouse Location</span>
                  <span className="sm:hidden">Add Warehouse</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Add New Warehouse Location</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Create a new warehouse location where you can store materials and set location-specific pricing
                </DialogDescription>
              </DialogHeader>
              <WarehouseSetupForm onSave={handleWarehouseSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Warehouse Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Warehouse</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update warehouse information and capacity settings
            </DialogDescription>
          </DialogHeader>
          {editingWarehouse && (
            <WarehouseEditForm 
              warehouse={editingWarehouse}
              onSave={handleWarehouseUpdate}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses.length}</div>
              <p className="text-xs text-muted-foreground">Active locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(allWarehouseMaterials).reduce((sum, materials) => {
                  // Count unique material types across all warehouses
                  const uniqueMaterialIds = new Set(materials.filter(m => m.isActive).map(m => m.materialId));
                  return sum + uniqueMaterialIds.size;
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Material types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(allWarehouseMaterials).reduce((sum, materials) => {
                  return sum + materials.filter(m => m.isActive).reduce((mSum, m) => mSum + m.quantity, 0);
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total units</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Warehouse Management</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage warehouse locations and their material inventory with advanced tracking
              </CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-3 h-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Locations</TabsTrigger>
                <TabsTrigger value="inventory" className="text-xs sm:text-sm">Materials & Pricing</TabsTrigger>
                <TabsTrigger value="warnings" className="relative text-xs sm:text-sm">
                  <span className="hidden sm:inline">Stock Warnings</span>
                  <span className="sm:hidden">Warnings</span>
                  {getWarningCount() > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs flex items-center justify-center"
                    >
                      {getWarningCount()}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-12">
              <WarehouseIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Warehouses Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first warehouse to get started with inventory management.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="grid gap-6 md:grid-cols-2">
                  {warehouses.map((warehouse) => {
                    const currentWarehouseMaterials = allWarehouseMaterials[warehouse.id] || [];
                    const activeMaterials = currentWarehouseMaterials.filter(m => m.isActive);
                    
                    return (
                    <Card key={warehouse.id} className="hover:shadow-md transition-shadow overflow-hidden">
                      {/* Map as header - no padding */}
                      <div className="w-full">
                        <WarehouseCardMap 
                          warehouse={warehouse} 
                          onZoomClick={() => {
                            setSelectedWarehouse(warehouse);
                            setShowFullScreenMap(true);
                          }}
                        />
                      </div>
                      
                      <CardHeader className="pt-4">
                        <CardTitle className="flex items-center justify-between">
                          {warehouse.name}
                          <Badge variant={activeMaterials.length ? "default" : "secondary"}>
                            {activeMaterials.length} materials
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.zipCode}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Materials Available:</span><br />
                            {activeMaterials.length} material types
                          </div>
                          <div>
                            <span className="font-medium">Capacity:</span><br />
                            {warehouse.capacity && warehouse.capacity > 0 
                              ? `${warehouse.capacity.toFixed(2)} m³` 
                              : 'Not specified'
                            }
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Stock:</span><br />
                            {activeMaterials.reduce((sum, m) => sum + m.quantity, 0)} units
                          </div>
                          <div>
                            <span className="font-medium">Status:</span><br />
                            <Badge variant={activeMaterials.length ? "default" : "secondary"}>
                              {activeMaterials.length ? "Active" : "Setup Required"}
                            </Badge>
                          </div>
                        </div>
                        
                        {warehouse.capacity && warehouse.capacity > 0 ? (
                          <div>
                            <span className="font-medium text-sm">Capacity Utilization:</span>
                            {(() => {
                              // Calculate total volume used based on material dimensions
                              const totalVolumeUsed = activeMaterials.reduce((sum, m) => {
                                // Use material volume if available, otherwise calculate from dimensions
                                let unitVolume = 1; // Default fallback
                                
                                if (m.material.volume && m.material.volume > 0) {
                                  unitVolume = m.material.volume;
                                } else if (m.material.length && m.material.width && m.material.height) {
                                  unitVolume = m.material.length * m.material.width * m.material.height;
                                }
                                
                                return sum + (m.quantity * unitVolume);
                              }, 0);
                              
                              const utilization = Math.min((totalVolumeUsed / warehouse.capacity) * 100, 100);
                              const available = Math.max(warehouse.capacity - totalVolumeUsed, 0);
                              
                              let statusText = 'Good';
                              
                              if (utilization >= 90) {
                                statusText = 'Critical';
                              } else if (utilization >= 75) {
                                statusText = 'High';
                              } else if (utilization >= 50) {
                                statusText = 'Moderate';
                              }
                              
                              const chartData = [
                                { name: "Used", value: utilization, fill: "hsl(var(--chart-1))" },
                                { name: "Available", value: 100 - utilization, fill: "hsl(var(--muted))" },
                              ];

                              const chartConfig = {
                                Used: {
                                  label: "Used",
                                  color: utilization >= 90 ? "hsl(0 84.2% 60.2%)" : 
                                         utilization >= 75 ? "hsl(47.9 95.8% 53.1%)" : 
                                         utilization >= 50 ? "hsl(24.6 95% 53.1%)" : 
                                         "hsl(142.1 76.2% 36.3%)",
                                },
                                Available: {
                                  label: "Available",
                                  color: "hsl(var(--muted))",
                                },
                              };

                              return (
                                <div className="mt-2 relative">
                                  {/* Visual Chart */}
                                  <ChartContainer config={chartConfig} className="h-32 sm:h-40">
                                    <RadialBarChart
                                      data={chartData}
                                      innerRadius={60}
                                      outerRadius={80}
                                      startAngle={90}
                                      endAngle={-270}
                                    >
                                      <RadialBar
                                        dataKey="value"
                                        cornerRadius={4}
                                        fill="var(--color-Used)"
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </RadialBar>
                                      <ChartTooltip
                                        content={
                                          <ChartTooltipContent
                                            formatter={(value) => `${Number(value).toFixed(1)}%`}
                                          />
                                        }
                                      />
                                    </RadialBarChart>
                                  </ChartContainer>
                                  
                                  {/* Center Text Overlay */}
                                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-lg sm:text-2xl font-bold text-foreground">
                                      {utilization.toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                                      {statusText}
                                    </span>
                                  </div>
                                  
                                  {/* Stats */}
                                  <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                                    <div className="flex justify-between items-center text-[11px] sm:text-xs">
                                      <span className="text-muted-foreground">Used:</span>
                                      <span className="font-medium">{totalVolumeUsed.toFixed(2)} m³</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] sm:text-xs">
                                      <span className="text-muted-foreground">Available:</span>
                                      <span className="font-medium">{available.toFixed(2)} m³</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] sm:text-xs">
                                      <span className="text-muted-foreground">Total Capacity:</span>
                                      <span className="font-medium">{warehouse.capacity.toFixed(2)} m³</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-sm">Capacity Utilization:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              Storage capacity not specified
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWarehouse(warehouse);
                              setActiveTab("inventory");
                            }}
                            className="flex-1"
                          >
                            <PackageIcon className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Manage Materials & Pricing</span>
                            <span className="sm:hidden">Manage Materials</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWarehouse(warehouse);
                              setShowEditDialog(true);
                            }}
                            className="sm:w-auto w-full"
                          >
                            <EditIcon className="h-4 w-4 mr-2" />
                            <span className="sm:hidden">Edit Warehouse</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}

              {activeTab === "inventory" && (
                <div>
                  {selectedWarehouse ? (
                    <>
                      <MaterialDragDropManager 
                        warehouse={selectedWarehouse} 
                        warehouses={warehouses}
                        onUpdate={fetchWarehouses}
                        onChangeWarehouse={() => setSelectedWarehouse(null)}
                        onMaterialsUpdate={handleMaterialsUpdate}
                        onWarehouseUpdate={fetchWarehouses}
                        onMaterialsRefresh={() => {
                          if (selectedWarehouse) {
                            refreshWarehouseMaterials(selectedWarehouse.id);
                          }
                          // Also refresh all warehouse materials for overview tab
                          refreshAllWarehouseMaterials();
                          
                          // Force immediate refresh of overview cards
                          setTimeout(() => {
                            refreshAllWarehouseMaterials();
                          }, 100);
                          
                          setTimeout(() => {
                            refreshAllWarehouseMaterials();
                          }, 1000);
                        }}
                        allWarehouseMaterials={allWarehouseMaterials}
                        highlightedMaterialIds={highlightedMaterialIds}
                      />
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <PackageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a Warehouse</h3>
                      <p className="text-muted-foreground mb-6">
                        Choose a warehouse to manage its materials and pricing.
                      </p>
                      
                      {warehouses.length > 0 ? (
                        <div className="max-w-md mx-auto">
                          <Select onValueChange={(value) => {
                            const warehouse = warehouses.find(w => w.id === value);
                            if (warehouse) {
                              setSelectedWarehouse(warehouse);
                            }
                          }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a warehouse..." />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{warehouse.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {warehouse.city}, {warehouse.state}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-muted-foreground mb-4">
                            No warehouses available. Create a warehouse first.
                          </p>
                          <Button onClick={() => setActiveTab("overview")}>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Create Warehouse
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "warnings" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">Stock Level Warnings</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Monitor material inventory levels and get alerts for low stock or critical shortages
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        fetchWarehouses();
                        refreshAllWarehouseMaterials();
                      }}
                      className="w-full sm:w-auto"
                    >
                      <RefreshCwIcon className="h-4 w-4 mr-2" />
                      Refresh Warnings
                    </Button>
                  </div>
                  
                  <WarehouseMaterialWarnings 
                    warehouses={warehouses}
                    allWarehouseMaterials={allWarehouseMaterials}
                    refreshTrigger={Object.keys(allWarehouseMaterials).length}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Full-screen map modal */}
      <FullScreenMapModal 
        warehouse={selectedWarehouse} 
        isOpen={showFullScreenMap} 
        onClose={() => setShowFullScreenMap(false)} 
      />
    </div>
  );
}
