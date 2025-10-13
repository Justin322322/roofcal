"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SaveIcon, Loader2Icon } from "lucide-react";
import { saveProject, updateProject, getProjectDetails } from "../actions";
import { AddressInput } from "@/components/map/address-input";
import { WarehouseSelector } from "@/components/map/warehouse-selector";
import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "../types";
import type { ProjectFromCalculator } from "@/types/project";
import type { Warehouse, Coordinates } from "@/types/location";

interface ProjectActionsProps {
  measurements: Measurements;
  results: CalculationResults;
  decisionTree: DecisionTreeResult;
  material: string;
  currentProjectId?: string;
  saveDialogOpen?: boolean;
  onSaveDialogChange?: (open: boolean) => void;
  saveEnabled?: boolean;
  selectedWarehouseId?: string;
  onWarehouseChange?: (warehouseId: string) => void;
  projectAddress?: { coordinates: { latitude: number; longitude: number } } | null;
  onAddressChange?: (address: { coordinates: { latitude: number; longitude: number } }) => void;
}

export function ProjectActions({
  measurements,
  results,
  decisionTree,
  material,
  currentProjectId,
  saveDialogOpen,
  onSaveDialogChange,
  saveEnabled,
  selectedWarehouseId,
  onWarehouseChange,
  projectAddress: _projectAddress, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAddressChange,
}: ProjectActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Save form state
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  
  // Address and warehouse state
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

  // Fetch warehouses when dialog opens
  useEffect(() => {
    if (saveDialogOpen) {
      const fetchWarehouses = async () => {
        try {
          const response = await fetch('/api/warehouses');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setWarehouses(result.data);
            }
          }
        } catch (error) {
          console.error("Failed to fetch warehouses:", error);
        }
      };
      fetchWarehouses();
    }
  }, [saveDialogOpen]);

  // Load project data when dialog opens and we have a currentProjectId
  useEffect(() => {
    if (saveDialogOpen && currentProjectId) {
      const loadProjectData = async () => {
        try {
          const result = await getProjectDetails(currentProjectId);
          if (result.success && result.project) {
            setProjectName(result.project.projectName);
            setClientName(result.project.clientName || "");
            setNotes(result.project.notes || "");
            // Load address and warehouse if available
            if (result.project.address) {
              setAddress({
                street: result.project.address,
                city: result.project.city || "",
                state: result.project.state || "",
                zipCode: result.project.zipCode || "",
              });
              if (result.project.latitude && result.project.longitude) {
                setCoordinates({
                  latitude: result.project.latitude,
                  longitude: result.project.longitude,
                });
                setIsValidated(true);
              }
              if (result.project.warehouseId) {
                onWarehouseChange?.(result.project.warehouseId);
              }
            }
          }
        } catch (error) {
          console.error("Failed to load project data:", error);
        }
      };
      loadProjectData();
    } else if (saveDialogOpen && !currentProjectId) {
      // Reset form when opening for new project
      setProjectName("");
      setClientName("");
      setNotes("");
      setAddress({ street: "", city: "", state: "", zipCode: "" });
      setCoordinates(null);
      setIsValidated(false);
      setDeliveryCost(null);
      setDeliveryDistance(null);
    }
  }, [saveDialogOpen, currentProjectId, onWarehouseChange]);

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!isValidated || !coordinates) {
      toast.error("Please validate the delivery address");
      return;
    }

    if (!selectedWarehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    setIsLoading(true);
    try {
      const projectData: ProjectFromCalculator = {
        measurements,
        results,
        decisionTree,
        material,
        projectName: projectName.trim(),
        clientName: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
        address: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        warehouseId: selectedWarehouseId,
        deliveryCost: deliveryCost || undefined,
        deliveryDistance: deliveryDistance || undefined,
      };

      // If we have a currentProjectId, update the existing project
      // Otherwise, create a new project
      const result = currentProjectId
        ? await updateProject(currentProjectId, projectData)
        : await saveProject(projectData);

      if (result.success) {
        const action = currentProjectId ? "updated" : "saved";
        toast.success(`Project ${action} successfully`, {
          description: `Project "${projectName}" has been ${action}`,
        });
        onSaveDialogChange?.(false);
        setProjectName("");
        setClientName("");
        setNotes("");
        setAddress({ street: "", city: "", state: "", zipCode: "" });
        setCoordinates(null);
        setIsValidated(false);
        setDeliveryCost(null);
        setDeliveryDistance(null);
      } else {
        const action = currentProjectId ? "update" : "save";
        toast.error(`Failed to ${action} project`, {
          description: result.error,
        });
      }
    } catch {
      const action = currentProjectId ? "update" : "save";
      toast.error(`Failed to ${action} project`, {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canSave = (results.totalCost > 0 || saveEnabled) && projectName.trim() && isValidated && selectedWarehouseId;

  return (
    <>
      {/* Save Project */}
      <Dialog
        open={saveDialogOpen || false}
        onOpenChange={onSaveDialogChange || (() => {})}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={results.totalCost <= 0 && !saveEnabled}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {currentProjectId ? "Update Project" : "Save Project"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentProjectId ? "Update Project" : "Save Project"}
            </DialogTitle>
            <DialogDescription>
              {currentProjectId
                ? "Update your current roof calculation project."
                : `Save your current roof calculation as a ${measurements.constructionMode === "repair" ? "repair" : "new construction"} project for future reference.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Residential Roof - 123 Main St"
                className="mt-1"
              />
            </div>

            {/* Delivery Address */}
            <div>
              <Label>Delivery Address *</Label>
              <AddressInput
                initialAddress={address}
                initialCoordinates={coordinates || undefined}
                onAddressChange={(geocodedAddress) => {
                  setAddress({
                    street: geocodedAddress.street || "",
                    city: geocodedAddress.city || "",
                    state: geocodedAddress.state || "",
                    zipCode: geocodedAddress.zipCode || "",
                  });
                  setCoordinates(geocodedAddress.coordinates);
                  setIsValidated(true);
                  onAddressChange?.(geocodedAddress);
                }}
                onCoordinatesChange={(coords) => {
                  setCoordinates(coords);
                  setIsValidated(true);
                }}
                className="mt-1"
                required
              />
            </div>

            {/* Warehouse Selection */}
            {isValidated && coordinates && (
              <div>
                <Label>Warehouse Selection *</Label>
                <WarehouseSelector
                  warehouses={warehouses}
                  selectedWarehouseId={selectedWarehouseId}
                  destination={coordinates}
                  onWarehouseSelect={(warehouseId) => {
                    onWarehouseChange?.(warehouseId);
                    
                    // Calculate delivery cost when warehouse is selected
                    if (coordinates) {
                      const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
                      if (selectedWarehouse) {
                        const calculateDelivery = async () => {
                          try {
                            const response = await fetch('/api/delivery/calculate', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                origin: {
                                  latitude: selectedWarehouse.latitude,
                                  longitude: selectedWarehouse.longitude,
                                },
                                destination: coordinates,
                                pricing: {
                                  baseRate: 50,
                                  perKmRate: 10,
                                }
                              }),
                            });
                            
                            if (response.ok) {
                              const result = await response.json();
                              if (result.success && result.data) {
                                setDeliveryCost(result.data.delivery.totalCost);
                                setDeliveryDistance(result.data.route.distance);
                              }
                            }
                          } catch (error) {
                            console.error('Failed to calculate delivery cost:', error);
                          }
                        };
                        calculateDelivery();
                      }
                    }
                  }}
                  className="mt-1"
                  showMap={false}
                />
                {deliveryCost && deliveryDistance && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Delivery Estimate</div>
                    <div className="text-sm text-muted-foreground">
                      Distance: {deliveryDistance.toFixed(1)} km • Cost: ₱{deliveryCost.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Optional client name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or comments..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onSaveDialogChange?.(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={!canSave || isLoading}
            >
              {isLoading && (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              )}
              {currentProjectId ? "Update Project" : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
