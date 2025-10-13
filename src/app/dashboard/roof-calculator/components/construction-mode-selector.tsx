"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HammerIcon,
  WrenchIcon,
  InfoIcon,
  FolderOpenIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { loadProject, getUserProjects } from "../actions";
import type { Measurements } from "../types";
import { formatStatus } from "@/lib/utils";

interface ConstructionModeSelectorProps {
  mode: "new" | "repair";
  onModeChange: (mode: "new" | "repair") => void;
  onProjectLoaded?: (data: {
    measurements: Measurements;
    material: string;
    projectId?: string;
  }) => void;
  currentProjectId?: string;
  onSaveRepairProject?: () => void;
}

export function ConstructionModeSelector({
  mode,
  onModeChange,
  onProjectLoaded,
  currentProjectId,
  onSaveRepairProject,
}: ConstructionModeSelectorProps) {
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [userProjects, setUserProjects] = useState<
    Array<{ id: string; projectName: string; status: string }>
  >([]);

  const handleLoadProjects = async () => {
    setIsLoading(true);
    try {
      const result = await getUserProjects();
      if (result.success && result.projects) {
        setUserProjects(result.projects);
        setLoadDialogOpen(true);
      } else {
        toast.error("Failed to load projects", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to load projects", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProject = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loadProject(selectedProjectId);

      if (result.success && result.data) {
        toast.success("Project loaded successfully", {
          description: `Project data has been loaded into the calculator`,
        });
        setLoadDialogOpen(false);
        setSelectedProjectId("");

        if (onProjectLoaded) {
          // When loading a project for repair, ensure construction mode is set to repair
          const projectData = {
            ...result.data,
            measurements: {
              ...result.data.measurements,
              constructionMode: "repair" as const,
            },
          };
          onProjectLoaded(projectData);
        }
      } else {
        toast.error("Failed to load project", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to load project", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-3">
      <Label>Construction Mode</Label>
      <RadioGroup
        value={mode}
        onValueChange={(value) => onModeChange(value as "new" | "repair")}
        className="grid grid-cols-2 gap-4"
      >
        <div>
          <RadioGroupItem value="new" id="mode-new" className="peer sr-only" />
          <Label
            htmlFor="mode-new"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
          >
            <HammerIcon className="mb-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">New Construction</div>
              <div className="text-xs text-muted-foreground mt-1">
                Full installation
              </div>
              <div className="text-xs font-medium text-primary mt-1">
                Labor: 40%
              </div>
            </div>
          </Label>
        </div>

        <div>
          <RadioGroupItem
            value="repair"
            id="mode-repair"
            className="peer sr-only"
          />
          <Label
            htmlFor="mode-repair"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
          >
            <WrenchIcon className="mb-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Repair</div>
              <div className="text-xs text-muted-foreground mt-1">
                Includes removal
              </div>
              <div className="text-xs font-medium text-primary mt-1">
                Labor: 20%
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {/* Repair Mode Information - Only show if no project is loaded */}
      {mode === "repair" && !currentProjectId && (
        <Alert className="mt-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <strong>Repair Mode Selected:</strong> Choose to load an existing
              project or create a new repair project.
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadProjects}
                disabled={isLoading}
                className="w-full"
              >
                <FolderOpenIcon className="h-4 w-4 mr-2" />
                Load Existing Project
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                variant="default"
                size="sm"
                onClick={onSaveRepairProject}
                className="w-full"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Enable Save Project
              </Button>
              <div className="text-sm text-muted-foreground">
                If you don&apos;t have an existing project to load, click this
                to enable the &quot;Save Project&quot; button below. This will
                allow you to save your current calculations as a repair project
                with reduced labor costs (20% vs 40% for new construction).
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Load Project Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Select a project to load its data into the calculator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectSelect">Select Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {userProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName} ({formatStatus(project.status)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLoadDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLoadProject}
              disabled={!selectedProjectId || isLoading}
            >
              {isLoading && (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              )}
              Load Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
