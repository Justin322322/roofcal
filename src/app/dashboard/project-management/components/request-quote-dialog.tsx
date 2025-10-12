"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, UserIcon, StarIcon, CheckCircleIcon } from "lucide-react";
import type { Project, ContractorInfo } from "@/types/project";

interface RequestQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onQuoteRequested: () => void;
}

export function RequestQuoteDialog({
  open,
  onOpenChange,
  project,
  onQuoteRequested,
}: RequestQuoteDialogProps) {
  const [contractors, setContractors] = useState<ContractorInfo[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<ContractorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContractors();
    }
  }, [open]);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contractors");
      
      if (response.ok) {
        const data = await response.json();
        setContractors(data.contractors || []);
      } else {
        const errorData = await response.json();
        toast.error("Failed to fetch contractors", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to fetch contractors", {
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!project || !selectedContractor) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/projects/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          contractorId: selectedContractor.id,
        }),
      });

      if (response.ok) {
        toast.success("Quote request sent successfully", {
          description: `Your project has been assigned to ${selectedContractor.firstName} ${selectedContractor.lastName}. They will review your project and send you a proposal.`,
        });
        onQuoteRequested();
        onOpenChange(false);
        setSelectedContractor(null);
      } else {
        const errorData = await response.json();
        toast.error("Failed to send quote request", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to send quote request", {
        description: "Network error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Quote for Project</DialogTitle>
          <DialogDescription>
            Select a contractor to send your project for a professional quote and proposal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{project.projectName}</CardTitle>
              <CardDescription>Project Details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Roof Area:</span>
                  <span className="ml-2 font-medium">{project.area.toFixed(1)} m²</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="ml-2 font-medium">{formatCurrency(project.totalCost)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Material:</span>
                  <span className="ml-2 font-medium">{project.material}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Roof Type:</span>
                  <span className="ml-2 font-medium">{project.roofType}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground text-sm">Dimensions:</span>
                <span className="ml-2 text-sm">{project.length}m × {project.width}m × {project.pitch}° pitch</span>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select a Contractor</CardTitle>
              <CardDescription>
                Choose from our verified contractors to get a professional quote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading contractors...</span>
                </div>
              ) : contractors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No contractors available at the moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {contractors.map((contractor) => (
                    <div
                      key={contractor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedContractor?.id === contractor.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedContractor(contractor)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            <span className="font-medium">
                              {contractor.firstName} {contractor.lastName}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {contractor.companyName}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {contractor.completedProjects || 0} completed projects
                            </span>
                            {contractor.rating && (
                              <div className="flex items-center gap-1">
                                <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                                <span>{contractor.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedContractor?.id === contractor.id && (
                          <CheckCircleIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedContractor || submitting}
          >
            {submitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Sending Request...
              </>
            ) : (
              "Send Quote Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
