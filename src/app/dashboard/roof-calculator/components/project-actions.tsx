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
import type {
  Measurements,
  CalculationResults,
  DecisionTreeResult,
} from "../types";
import type { ProjectFromCalculator } from "@/types/project";

interface ProjectActionsProps {
  measurements: Measurements;
  results: CalculationResults;
  decisionTree: DecisionTreeResult;
  material: string;
  currentProjectId?: string;
  saveDialogOpen?: boolean;
  onSaveDialogChange?: (open: boolean) => void;
  saveEnabled?: boolean;
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
}: ProjectActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Save form state
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

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
    }
  }, [saveDialogOpen, currentProjectId]);

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
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

  const canSave = (results.totalCost > 0 || saveEnabled) && projectName.trim();

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
        <DialogContent className="sm:max-w-md">
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
          <div className="space-y-4">
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
