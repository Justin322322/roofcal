"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Removed icon imports - using text-only interface
import type { Project } from "@/types/project";

interface ProposalViewerProps {
  project: Project;
  onClose: () => void;
}

export function ProposalViewer({ project, onClose }: ProposalViewerProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleProposalAction = async (action: "accept" | "reject") => {
    setActionLoading(action);
    try {
      const response = await fetch(`/api/proposals/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(`Proposal ${action}ed successfully`);
        onClose();
        // Refresh the page or update state as needed
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to ${action} proposal`, {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error(`Failed to ${action} proposal`, {
        description: "Network error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const parseProposalData = () => {
    try {
      if (project.notes && project.notes.startsWith('{')) {
        return JSON.parse(project.notes);
      }
      return { proposalText: project.notes };
    } catch {
      return { proposalText: project.notes };
    }
  };

  const proposalData = parseProposalData();
  const status = project.proposalStatus || "DRAFT";

  return (
    <div className="space-y-8">
      {/* Proposal Header */}
      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">{project.projectName}</CardTitle>
              <CardDescription className="text-base">Project Proposal</CardDescription>
            </div>
            <Badge className={`${getStatusColor(status)} px-4 py-2 text-sm font-medium`}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Client</div>
              <div className="text-base font-medium">{project.clientName || "Unknown"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Sent Date</div>
              <div className="text-base">{formatDate(project.proposalSent || null)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Project Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Roof Area</div>
              <div className="text-base font-medium">{project.area.toFixed(1)} m²</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Material</div>
              <div className="text-base font-medium">{project.material}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Roof Type</div>
              <div className="text-base font-medium">{project.roofType}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Construction Mode</div>
              <div className="text-base font-medium">{project.constructionMode}</div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Dimensions</div>
            <div className="text-base">{project.length}m × {project.width}m × {project.pitch}° pitch</div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Pricing Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-base">Materials</span>
              <span className="text-base font-medium">{formatCurrency(project.materialCost)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-base">Labor</span>
              <span className="text-base font-medium">{formatCurrency(project.laborCost)}</span>
            </div>
            {project.removalCost > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-base">Removal</span>
                <span className="text-base font-medium">{formatCurrency(project.removalCost)}</span>
              </div>
            )}
            {proposalData.customPricing?.additionalFees > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-base">Additional Fees</span>
                <span className="text-base font-medium">{formatCurrency(proposalData.customPricing.additionalFees)}</span>
              </div>
            )}
          </div>
          <Separator className="my-6" />
          <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-4">
            <span className="text-lg font-semibold">Total Cost</span>
            <span className="text-xl font-bold">
              {proposalData.customPricing 
                ? formatCurrency(proposalData.customPricing.totalCost || project.totalCost)
                : formatCurrency(project.totalCost)
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Message */}
      {proposalData.proposalText && (
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold">Proposal Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-base max-w-none">
              <p className="whitespace-pre-wrap text-base leading-relaxed">
                {proposalData.proposalText}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {status === "SENT" && (
        <Card>
          <CardContent className="pt-8">
            <Alert className="mb-8">
              <AlertDescription className="text-base">
                This proposal is waiting for your response. Please review the details and either accept or reject the proposal.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={onClose} className="px-6">
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleProposalAction("reject")}
                disabled={actionLoading !== null}
                className="px-6"
              >
                {actionLoading === "reject" ? "Rejecting..." : "Reject Proposal"}
              </Button>
              <Button
                onClick={() => handleProposalAction("accept")}
                disabled={actionLoading !== null}
                className="px-6"
              >
                {actionLoading === "accept" ? "Accepting..." : "Accept Proposal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {status === "ACCEPTED" && (
        <Alert>
          <AlertDescription className="text-base">
            This proposal has been accepted. The project is now ready to begin.
          </AlertDescription>
        </Alert>
      )}

      {status === "REJECTED" && (
        <Alert>
          <AlertDescription className="text-base">
            This proposal has been rejected. The contractor may revise and resend the proposal.
          </AlertDescription>
        </Alert>
      )}

      {status !== "SENT" && (
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
