"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon } from "lucide-react";
import type { Project } from "@/types/project";

interface ProposalBuilderProps {
  project: Project;
  onProposalSent: () => void;
  onClose: () => void;
  mode?: "create" | "revise";
}

export function ProposalBuilder({ project, onProposalSent, onClose, mode = "create" }: ProposalBuilderProps) {
  const [proposalText, setProposalText] = useState("");
  const [customPricing, setCustomPricing] = useState({
    materialCost: project.materialCost,
    laborCost: project.laborCost,
    additionalFees: 0,
    totalCost: project.totalCost,
  });
  const [loading, setLoading] = useState(false);

  // Parse existing proposal data if in revise mode
  useEffect(() => {
    if (mode === "revise" && project.notes) {
      try {
        const parsedNotes = JSON.parse(project.notes);
        if (parsedNotes.proposalText) {
          setProposalText(parsedNotes.proposalText);
        }
        if (parsedNotes.customPricing) {
          setCustomPricing({
            ...parsedNotes.customPricing,
            totalCost: calculateTotalFromPricing(parsedNotes.customPricing),
          });
        }
      } catch (error) {
        console.error("Error parsing existing proposal:", error);
      }
    }
  }, [mode, project.notes]);

  const calculateTotalFromPricing = (pricing: {
    materialCost?: number;
    laborCost?: number;
    additionalFees?: number;
  }) => {
    return (pricing.materialCost || 0) + (pricing.laborCost || 0) + (pricing.additionalFees || 0);
  };

  const handleSubmit = async () => {
    if (!proposalText.trim()) {
      toast.error("Please provide a proposal message");
      return;
    }

    try {
      setLoading(true);
      const url = mode === "revise" ? `/api/proposals/${project.id}` : "/api/proposals";
      const method = mode === "revise" ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(mode === "create" && { projectId: project.id }),
          proposalText,
          customPricing: customPricing.additionalFees > 0 ? customPricing : undefined,
        }),
      });

      if (response.ok) {
        const action = mode === "revise" ? "revised" : "sent";
        toast.success(`Proposal ${action} successfully`, {
          description: `The client will be notified and can review your ${mode === "revise" ? "revised" : ""} proposal.`,
        });
        onProposalSent();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to ${mode === "revise" ? "revise" : "send"} proposal`, {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      const action = mode === "revise" ? "revise" : "send";
      toast.error(`Failed to ${action} proposal`, {
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const calculateTotal = () => {
    return customPricing.materialCost + customPricing.laborCost + customPricing.additionalFees;
  };

  return (
    <div className="space-y-8">
      {/* Project Summary */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Project Summary</CardTitle>
          <CardDescription className="text-base">{project.projectName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Client</div>
              <div className="text-base font-medium">{project.clientName || "Unknown"}</div>
            </div>
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
          </div>
          <Separator className="my-6" />
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Dimensions</div>
            <div className="text-base">{project.length}m × {project.width}m × {project.pitch}° pitch</div>
          </div>
        </CardContent>
      </Card>

      {/* Current Pricing */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Current Pricing Breakdown</CardTitle>
          <CardDescription className="text-base">Base estimate from the roof calculator</CardDescription>
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
          </div>
          <Separator className="my-6" />
          <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-4">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold">{formatCurrency(project.totalCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Custom Pricing (Optional) */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Custom Pricing (Optional)</CardTitle>
          <CardDescription className="text-base">
            Adjust pricing if needed for this specific project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="materialCost" className="text-sm font-medium">Material Cost</Label>
              <Input
                id="materialCost"
                type="number"
                value={customPricing.materialCost}
                onChange={(e) => setCustomPricing(prev => ({
                  ...prev,
                  materialCost: parseFloat(e.target.value) || 0
                }))}
                placeholder="0"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laborCost" className="text-sm font-medium">Labor Cost</Label>
              <Input
                id="laborCost"
                type="number"
                value={customPricing.laborCost}
                onChange={(e) => setCustomPricing(prev => ({
                  ...prev,
                  laborCost: parseFloat(e.target.value) || 0
                }))}
                placeholder="0"
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalFees" className="text-sm font-medium">Additional Fees</Label>
            <Input
              id="additionalFees"
              type="number"
              value={customPricing.additionalFees}
              onChange={(e) => setCustomPricing(prev => ({
                ...prev,
                additionalFees: parseFloat(e.target.value) || 0
              }))}
              placeholder="0"
              className="h-11"
            />
          </div>
          <Separator className="my-6" />
          <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-4">
            <span className="text-lg font-semibold">Proposed Total</span>
            <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
          </div>
          {calculateTotal() !== project.totalCost && (
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="text-muted-foreground">Difference from estimate</span>
              <span className={`font-medium ${calculateTotal() > project.totalCost ? "text-red-600" : "text-green-600"}`}>
                {calculateTotal() > project.totalCost ? "+" : ""}{formatCurrency(calculateTotal() - project.totalCost)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Message */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Proposal Message</CardTitle>
          <CardDescription className="text-base">
            Write a detailed message explaining your proposal to the client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="proposalText" className="text-sm font-medium">Message to Client</Label>
            <Textarea
              id="proposalText"
              placeholder="Dear [Client Name],&#10;&#10;Thank you for requesting a quote for your roof project. Based on the specifications provided, I'm pleased to present the following proposal:&#10;&#10;[Your detailed proposal message here]&#10;&#10;Please feel free to contact me if you have any questions.&#10;&#10;Best regards,&#10;[Your Name]"
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              className="min-h-[200px] text-base"
            />
          </div>
          
          {/* Proposal Summary */}
          {proposalText && (
            <div className="p-6 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-4 text-base">Proposal Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Project</span>
                  <span className="text-sm">{project.projectName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Proposed Cost</span>
                  <span className="text-sm font-medium">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Badge variant={mode === "revise" ? "secondary" : "outline"} className="text-xs">
                    {mode === "revise" ? "REVISED" : "SENT"}
                  </Badge>
                </div>
                {mode === "revise" && (
                  <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                    This is a revision of your previous proposal
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={onClose} className="px-6">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !proposalText.trim()} className="px-6">
          {loading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              {mode === "revise" ? "Revising..." : "Sending..."}
            </>
          ) : (
            mode === "revise" ? "Send Revised Proposal" : "Send Proposal"
          )}
        </Button>
      </div>
    </div>
  );
}
