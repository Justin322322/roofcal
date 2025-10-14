"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2Icon, SaveIcon } from "lucide-react";

interface Project {
  id: string;
  projectName: string;
  status: string;
  proposalStatus: string | null;
  totalCost: number;
  area: number;
  material: string;
  address: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  proposalSent?: Date | null;
  notes?: string | null;
  materialCost?: number;
  laborCost?: number;
  deliveryCost?: number;
  contractor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface ProjectEditorProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ProjectEditor({ project, isOpen, onClose, onSave }: ProjectEditorProps) {
  const [projectName, setProjectName] = useState(project.projectName);
  const [notes, setNotes] = useState(project.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      toast.success("Project updated successfully");
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project information and notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          {/* Project Details (Read-only) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Material</Label>
              <Input value={project.material} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Input value={`${project.area.toFixed(2)} sq.m`} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={project.status} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Total Cost</Label>
              <Input value={`₱${project.totalCost.toLocaleString()}`} disabled className="bg-muted" />
            </div>
          </div>

          {/* Address (Read-only) */}
          {project.address && (
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={`${project.address}, ${project.city}, ${project.state}`} 
                disabled 
                className="bg-muted" 
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or comments..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

