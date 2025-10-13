"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2Icon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CalculatorIcon,
  AlertCircleIcon,
  SendIcon,
} from "lucide-react";

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
  contractor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  // Original estimates
  materialCost?: number;
  laborCost?: number;
  deliveryCost?: number | null;
  length?: number;
  width?: number;
  pitch?: number;
  roofType?: string;
  floors?: number;
}

interface ProposalViewerProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onProposalResponse?: (action: "accept" | "reject") => void;
}

export function ProposalViewer({ project, isOpen, onClose, onProposalResponse }: ProposalViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // For now, we'll use the original project costs as the proposal
  // In a full implementation, these would come from a separate Proposal table
  const proposalData = {
    materialCost: project.materialCost,
    laborCost: project.laborCost,
    deliveryCost: project.deliveryCost || 0,
    totalAmount: project.totalCost,
    additionalLineItems: [],
    validityDays: 30,
    notes: project.notes || "Standard proposal based on project specifications.",
  };

  const handleAcceptProposal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/proposals/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "accept",
        }),
      });

      if (response.ok) {
        toast.success("Proposal accepted successfully", {
          description: "The contractor has been notified and the project can now begin",
        });
        onProposalResponse?.("accept");
        onClose();
      } else {
        const error = await response.json();
        toast.error("Failed to accept proposal", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Failed to accept proposal", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/proposals/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "reject",
          reason: rejectionReason.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Proposal rejected successfully", {
          description: "The contractor has been notified. You can request quotes from other contractors.",
        });
        onProposalResponse?.("reject");
        onClose();
      } else {
        const error = await response.json();
        toast.error("Failed to reject proposal", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Failed to reject proposal", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canAccept = project.proposalStatus === "SENT";
  const canReject = project.proposalStatus === "SENT";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Proposal Review
          </DialogTitle>
          <DialogDescription>
            Review the contractor&apos;s proposal for your project: {project.projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Contractor:</span>
                    <span>{project.contractor?.firstName} {project.contractor?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span>{project.address}, {project.city}, {project.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Proposal Date:</span>
                    <span>{project.proposalSent ? new Date(project.proposalSent).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div><span className="font-medium">Material:</span> {project.material}</div>
                  <div><span className="font-medium">Area:</span> {project.area.toFixed(2)} m²</div>
                  <div><span className="font-medium">Roof Type:</span> {project.roofType}</div>
                  <div><span className="font-medium">Dimensions:</span> {project.length}m × {project.width}m</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalculatorIcon className="h-5 w-5" />
                Proposal Breakdown
              </CardTitle>
              <CardDescription>
                Detailed cost breakdown for your roofing project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Materials ({project.material})</span>
                  <span className="font-medium">₱{(proposalData.materialCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Labor & Installation</span>
                  <span className="font-medium">₱{(proposalData.laborCost || 0).toFixed(2)}</span>
                </div>
                {proposalData.deliveryCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Delivery</span>
                    <span className="font-medium">₱{proposalData.deliveryCost.toFixed(2)}</span>
                  </div>
                )}
                
                {proposalData.additionalLineItems.map((item: {description: string; amount: number}, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{item.description}</span>
                    <span className="font-medium">₱{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Project Cost</span>
                <span className="text-primary">₱{proposalData.totalAmount.toFixed(2)}</span>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Proposal Details</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Valid for {proposalData.validityDays} days from proposal date</div>
                  <div>• Price includes materials, labor, and delivery</div>
                  <div>• Payment terms to be discussed upon acceptance</div>
                  <div>• Work to begin within 2 weeks of acceptance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Notes */}
          {proposalData.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contractor Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{proposalData.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Confirmation */}
          {action && (
            <Card className={action === "accept" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-lg ${
                  action === "accept" ? "text-green-800" : "text-red-800"
                }`}>
                  {action === "accept" ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                  Confirm {action === "accept" ? "Acceptance" : "Rejection"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {action === "accept" ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      By accepting this proposal, you agree to the terms and pricing outlined above. 
                      The contractor will be notified and can begin work as scheduled.
                    </p>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">Next Steps:</div>
                      <ul className="text-sm mt-1 space-y-1">
                        <li>• Contractor will contact you to schedule start date</li>
                        <li>• Materials will be ordered and delivered</li>
                        <li>• Work will begin within 2 weeks of acceptance</li>
                        <li>• Payment terms will be discussed separately</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Please provide a reason for rejecting this proposal. This helps the contractor 
                      understand your concerns and potentially revise their offer.
                    </p>
                    <div>
                      <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., Price too high, Timeline doesn&apos;t work, Prefer different materials..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
          
          {!action && canAccept && (
            <Button
              onClick={() => setAction("accept")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Accept Proposal
            </Button>
          )}
          
          {!action && canReject && (
            <Button
              variant="destructive"
              onClick={() => setAction("reject")}
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Reject Proposal
            </Button>
          )}
          
          {action === "accept" && (
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleAcceptProposal}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                <SendIcon className="h-4 w-4 mr-2" />
                Confirm Acceptance
              </Button>
            </>
          )}
          
          {action === "reject" && (
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectProposal}
                disabled={isLoading || !rejectionReason.trim()}
              >
                {isLoading && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                <SendIcon className="h-4 w-4 mr-2" />
                Confirm Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
