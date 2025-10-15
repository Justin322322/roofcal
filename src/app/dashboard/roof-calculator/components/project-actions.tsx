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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { SaveIcon, Loader2Icon } from "lucide-react";
import { saveProject, updateProject, getProjectDetails, saveProjectForCustomer, saveProjectForAdminSelf } from "../actions";
import { getBudgetValidationResult } from "./budget-validator";
import { AddressInput } from "@/components/map/address-input";
import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "../types";
import type { ProjectFromCalculator } from "@/types/project";
import type { Coordinates } from "@/types/location";

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
  isHelpRequest?: boolean;
  helpRequestClientId?: string | null;
  helpRequestClient?: { name: string; email: string } | null;
  isAdminMode?: boolean;
  isAdminSelfMode?: boolean;
  selectedClientId?: string;
  onProjectCreated?: () => void;
  isBudgetSufficient?: boolean;
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
  isHelpRequest = false,
  helpRequestClientId,
  helpRequestClient,
  isAdminMode = false,
  isAdminSelfMode = false,
  selectedClientId,
  onProjectCreated,
  isBudgetSufficient = true,
}: ProjectActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Save form state
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  
  // Address and warehouse state
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

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
              setAddress(result.project.address || "");
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
      setAddress("");
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

    // Budget validation - block save if budget is insufficient
    if (!isBudgetSufficient) {
      const budgetValidation = getBudgetValidationResult(measurements.budgetAmount, results.totalCost);
      const budget = parseFloat(measurements.budgetAmount) || 0;
      const shortfall = budgetValidation.shortfall;
      
      toast.error("Cannot save project: Budget insufficient", {
        description: `Your budget (₱${budget.toLocaleString()}) is less than the total cost (₱${results.totalCost.toLocaleString()}). Please increase your budget by ₱${shortfall.toLocaleString()}.`,
      });
      return;
    }

    // Skip address validation for admin self mode
    if (!isAdminSelfMode && (!isValidated || !coordinates)) {
      toast.error("Please validate the delivery address");
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
        address: address,
        latitude: coordinates?.latitude || 0,
        longitude: coordinates?.longitude || 0,
        warehouseId: selectedWarehouseId || undefined,
        deliveryCost: deliveryCost || undefined,
        deliveryDistance: deliveryDistance || undefined,
      };

      let result;
      
      if (currentProjectId) {
        // Update existing project
        result = await updateProject(currentProjectId, projectData);
      } else if (isAdminSelfMode) {
        // Save project for admin self-estimation
        result = await saveProjectForAdminSelf(projectData);
      } else if (isHelpRequest && helpRequestClientId) {
        // Save project for customer (help request) - no contractor required
        result = await saveProjectForCustomer(projectData, helpRequestClientId, undefined);
      } else if (isAdminMode && selectedClientId) {
        // Save project for customer (admin mode) - no contractor required
        result = await saveProjectForCustomer(projectData, selectedClientId, undefined);
      } else {
        // Save normal project
        result = await saveProject(projectData);
      }

      if (result.success) {
        const isCreatingForClient = isHelpRequest || isAdminMode;
        const action = currentProjectId ? "updated" : (isCreatingForClient ? "created for client" : (isAdminSelfMode ? "saved as estimation" : "saved"));
        const description = isCreatingForClient 
          ? `Project "${projectName}" has been created for ${helpRequestClient?.name || "the client"}`
          : isAdminSelfMode
            ? `Project estimation "${projectName}" has been saved as DRAFT`
            : `Project "${projectName}" has been ${currentProjectId ? "updated" : "saved"}`;
        
        toast.success(`Project ${action} successfully`, {
          description,
        });
        onSaveDialogChange?.(false);
        setProjectName("");
        setClientName("");
        setNotes("");
        setAddress("");
        setCoordinates(null);
        setIsValidated(false);
        setDeliveryCost(null);
        setDeliveryDistance(null);
        
        // Call the callback for admin mode, admin self mode, or help requests
        if ((isAdminMode || isAdminSelfMode || isHelpRequest) && onProjectCreated) {
          onProjectCreated();
        }
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

  const canSave = (results.totalCost > 0 || saveEnabled) && projectName.trim() && (isAdminSelfMode || isValidated) && isBudgetSufficient;

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
            title={!isBudgetSufficient ? "Cannot save: Budget insufficient" : undefined}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {currentProjectId ? "Update Project" : "Save Project"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentProjectId 
                ? "Update Project" 
                : isAdminSelfMode
                  ? "Save Project Estimation"
                  : isHelpRequest 
                    ? "Create Project for Client" 
                    : "Save Project"}
            </DialogTitle>
            <DialogDescription>
              {currentProjectId
                ? "Update your current roof calculation project."
                : isAdminSelfMode
                  ? `Save your project estimation as a DRAFT project for your own use. No client assignment or material tracking required.`
                  : isHelpRequest
                    ? `Creating a project for ${helpRequestClient?.name || "the requesting client"}. This project will be owned by the client and they will receive a notification.`
                    : `Save your current roof calculation as a ${measurements.constructionMode === "repair" ? "repair" : "new construction"} project for future reference.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Budget Insufficient Alert */}
            {!isBudgetSufficient && (
              <Alert variant="destructive">
                <XCircleIcon className="h-4 w-4" />
                <AlertTitle>Budget Insufficient - Cannot Save Project</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      You cannot save this project until your budget meets or exceeds the total cost.
                    </div>
                    <div>
                      <strong>Budget:</strong> ₱{parseFloat(measurements.budgetAmount || "0").toLocaleString()}
                      <br />
                      <strong>Total Cost:</strong> ₱{results.totalCost.toLocaleString()}
                      <br />
                      <strong>Shortfall:</strong> ₱{getBudgetValidationResult(measurements.budgetAmount, results.totalCost).shortfall.toLocaleString()}
                    </div>
                    <div>
                      <strong>Required action:</strong> Increase your budget or reduce project specifications.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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

            {/* Delivery Address - Hide for admin self mode */}
            {!isAdminSelfMode && (
              <div>
                <Label>Delivery Address *</Label>
                <AddressInput
                  initialAddress={address}
                  initialCoordinates={coordinates || undefined}
                  onAddressChange={(geocodedAddress) => {
                    setAddress(geocodedAddress.formattedAddress || "");
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
          <DialogFooter className="gap-2">
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
              {currentProjectId ? "Update Project" : (isAdminSelfMode ? "Save Estimation" : "Save Project")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
