"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DollarSignIcon, 
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  ClockIcon
} from "lucide-react";
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
    <div className="space-y-6">
      {/* Proposal Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                {project.projectName}
              </CardTitle>
              <CardDescription>Project Proposal</CardDescription>
            </div>
            <Badge className={`${getStatusColor(status)}`}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{project.clientName || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sent:</span>
              <span className="font-medium">{formatDate(project.proposalSent || null)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Roof Area:</span>
              <span className="ml-2 font-medium">{project.area.toFixed(1)} m²</span>
            </div>
            <div>
              <span className="text-muted-foreground">Material:</span>
              <span className="ml-2 font-medium">{project.material}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Roof Type:</span>
              <span className="ml-2 font-medium">{project.roofType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Construction:</span>
              <span className="ml-2 font-medium">{project.constructionMode}</span>
            </div>
          </div>
          <Separator />
          <div className="text-sm">
            <span className="text-muted-foreground">Dimensions:</span>
            <span className="ml-2">{project.length}m × {project.width}m × {project.pitch}° pitch</span>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Pricing Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Materials:</span>
            <span>{formatCurrency(project.materialCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Labor:</span>
            <span>{formatCurrency(project.laborCost)}</span>
          </div>
          {project.removalCost > 0 && (
            <div className="flex justify-between text-sm">
              <span>Removal:</span>
              <span>{formatCurrency(project.removalCost)}</span>
            </div>
          )}
          {proposalData.customPricing?.additionalFees > 0 && (
            <div className="flex justify-between text-sm">
              <span>Additional Fees:</span>
              <span>{formatCurrency(proposalData.customPricing.additionalFees)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium text-lg">
            <span>Total Cost:</span>
            <span>
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
          <CardHeader>
            <CardTitle>Proposal Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {proposalData.proposalText}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {status === "SENT" && (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <ClockIcon className="h-4 w-4" />
              <AlertDescription>
                This proposal is waiting for your response. Please review the details and either accept or reject the proposal.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleProposalAction("reject")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "reject" ? "Rejecting..." : (
                  <>
                    <XCircleIcon className="mr-2 h-4 w-4" />
                    Reject Proposal
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleProposalAction("accept")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "accept" ? "Accepting..." : (
                  <>
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    Accept Proposal
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {status === "ACCEPTED" && (
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This proposal has been accepted. The project is now ready to begin.
          </AlertDescription>
        </Alert>
      )}

      {status === "REJECTED" && (
        <Alert>
          <XCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This proposal has been rejected. The contractor may revise and resend the proposal.
          </AlertDescription>
        </Alert>
      )}

      {status !== "SENT" && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
