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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SaveIcon, Loader2Icon, SendIcon, UsersIcon } from "lucide-react";
import { saveProject, updateProject, getProjectDetails, saveProjectForCustomer } from "../actions";
import { AddressInput } from "@/components/map/address-input";
import { formatCurrency, formatArea } from "@/lib/utils";
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
  selectedClientId?: string;
  onProjectCreated?: () => void;
}

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  completedProjects: number;
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
  selectedClientId,
  onProjectCreated,
}: ProjectActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Save form state
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

  // Quote request form state
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  
  // Address and warehouse state
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

  // Fetch contractors when dialog opens
  useEffect(() => {
    if (saveDialogOpen) {
      const fetchContractors = async () => {
        try {
          const response = await fetch('/api/contractors');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.contractors) {
              setContractors(result.contractors);
            }
          }
        } catch (error) {
          console.error("Failed to fetch contractors:", error);
        }
      };
      fetchContractors();
    }
  }, [saveDialogOpen]);

  // Fetch contractors when quote dialog opens
  useEffect(() => {
    if (quoteDialogOpen) {
      const fetchContractors = async () => {
        setIsLoadingContractors(true);
        try {
          const response = await fetch('/api/contractors');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.contractors) {
              setContractors(result.contractors);
            }
          }
        } catch (error) {
          console.error("Failed to fetch contractors:", error);
          toast.error("Failed to load contractors");
        } finally {
          setIsLoadingContractors(false);
        }
      };
      fetchContractors();
    }
  }, [quoteDialogOpen]);

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

    if (!isValidated || !coordinates) {
      toast.error("Please validate the delivery address");
      return;
    }

    if (!selectedWarehouseId) {
      toast.error("Please select a contractor");
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
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        warehouseId: selectedWarehouseId,
        deliveryCost: deliveryCost || undefined,
        deliveryDistance: deliveryDistance || undefined,
      };

      let result;
      
      if (currentProjectId) {
        // Update existing project
        result = await updateProject(currentProjectId, projectData);
      } else if ((isHelpRequest && helpRequestClientId) || (isAdminMode && selectedClientId)) {
        // Save project for customer (help request or admin mode)
        const clientId = isAdminMode ? selectedClientId : helpRequestClientId;
        result = await saveProjectForCustomer(projectData, clientId!, selectedWarehouseId!);
      } else {
        // Save normal project
        result = await saveProject(projectData);
      }

      if (result.success) {
        const isCreatingForClient = isHelpRequest || isAdminMode;
        const action = currentProjectId ? "updated" : (isCreatingForClient ? "created for client" : "saved");
        const description = isCreatingForClient 
          ? `Project "${projectName}" has been created for ${helpRequestClient?.name || "the client"}`
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
        
        // Call the callback for admin mode
        if (isAdminMode && onProjectCreated) {
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

  const handleRequestQuote = async () => {
    if (!currentProjectId) {
      toast.error("Please save the project first before requesting a quote");
      return;
    }

    if (!selectedContractorId) {
      toast.error("Please select a contractor");
      return;
    }

    setIsSendingQuote(true);
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/send-to-contractor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractorId: selectedContractorId,
          note: quoteNote.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Quote request sent successfully", {
          description: "The contractor has been notified and will review your project",
        });
        setQuoteDialogOpen(false);
        setSelectedContractorId("");
        setQuoteNote("");
      } else {
        const error = await response.json();
        toast.error("Failed to send quote request", {
          description: error.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error sending quote request:", error);
      toast.error("Failed to send quote request", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSendingQuote(false);
    }
  };

  const canSave = (results.totalCost > 0 || saveEnabled) && projectName.trim() && isValidated && selectedWarehouseId;
  const canRequestQuote = currentProjectId && results.totalCost > 0;
  const showRequestQuote = currentProjectId && results.totalCost > 0;

  return (
    <>
      {/* Request Quote - Only show if project is saved and has calculations */}
      {showRequestQuote && (
        <Dialog
          open={quoteDialogOpen}
          onOpenChange={setQuoteDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              disabled={!canRequestQuote}
              className="bg-primary hover:bg-primary/90"
            >
              <SendIcon className="h-4 w-4 mr-2" />
              Request Quote
            </Button>
          </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Request Quote from Contractor
            </DialogTitle>
            <DialogDescription>
              Select a contractor to review your project and provide a custom proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractor">Select Contractor *</Label>
              <Select
                value={selectedContractorId}
                onValueChange={setSelectedContractorId}
                disabled={isLoadingContractors}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder={
                    isLoadingContractors ? "Loading contractors..." : "Choose a contractor"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{contractor.companyName}</span>
                        <span className="text-xs text-muted-foreground">
                          {contractor.completedProjects} completed projects
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quoteNote">Message to Contractor (Optional)</Label>
              <Textarea
                id="quoteNote"
                value={quoteNote}
                onChange={(e) => setQuoteNote(e.target.value)}
                placeholder="Add any specific requirements or questions for the contractor..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Project Summary</div>
              <div className="text-sm text-muted-foreground mt-1">
                <div>Material: {material}</div>
                <div>Total Area: {formatArea(results.area)}</div>
                <div>Estimated Cost: {formatCurrency(results.totalCost)}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuoteDialogOpen(false)}
              disabled={isSendingQuote}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestQuote}
              disabled={!selectedContractorId || isSendingQuote}
            >
              {isSendingQuote && (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              )}
              Send Quote Request
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      )}

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
              {currentProjectId 
                ? "Update Project" 
                : isHelpRequest 
                  ? "Create Project for Client" 
                  : "Save Project"}
            </DialogTitle>
            <DialogDescription>
              {currentProjectId
                ? "Update your current roof calculation project."
                : isHelpRequest
                  ? `Creating a project for ${helpRequestClient?.name || "the requesting client"}. This project will be owned by the client and they will receive a notification.`
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

            {/* Contractor Selection */}
            {isValidated && coordinates && (
              <div>
                <Label>Contractor Selection *</Label>
                <Select
                  value={selectedWarehouseId || ""}
                  onValueChange={(value) => {
                    onWarehouseChange?.(value);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {contractor.firstName} {contractor.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {contractor.companyName} • {contractor.completedProjects} projects completed
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
