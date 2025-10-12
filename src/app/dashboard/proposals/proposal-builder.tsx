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
import { Loader2Icon, SendIcon, DollarSignIcon, FileTextIcon } from "lucide-react";
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
    <div className="space-y-6">
      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Project Summary
          </CardTitle>
          <CardDescription>{project.projectName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Client:</span>
              <span className="ml-2 font-medium">{project.clientName || "Unknown"}</span>
            </div>
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
          </div>
          <Separator />
          <div className="text-sm">
            <span className="text-muted-foreground">Dimensions:</span>
            <span className="ml-2">{project.length}m × {project.width}m × {project.pitch}° pitch</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Current Pricing Breakdown
          </CardTitle>
          <CardDescription>Base estimate from the roof calculator</CardDescription>
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
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatCurrency(project.totalCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Custom Pricing (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Pricing (Optional)</CardTitle>
          <CardDescription>
            Adjust pricing if needed for this specific project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="materialCost">Material Cost</Label>
              <Input
                id="materialCost"
                type="number"
                value={customPricing.materialCost}
                onChange={(e) => setCustomPricing(prev => ({
                  ...prev,
                  materialCost: parseFloat(e.target.value) || 0
                }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="laborCost">Labor Cost</Label>
              <Input
                id="laborCost"
                type="number"
                value={customPricing.laborCost}
                onChange={(e) => setCustomPricing(prev => ({
                  ...prev,
                  laborCost: parseFloat(e.target.value) || 0
                }))}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="additionalFees">Additional Fees</Label>
            <Input
              id="additionalFees"
              type="number"
              value={customPricing.additionalFees}
              onChange={(e) => setCustomPricing(prev => ({
                ...prev,
                additionalFees: parseFloat(e.target.value) || 0
              }))}
              placeholder="0"
            />
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Proposed Total:</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
          {calculateTotal() !== project.totalCost && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Difference from estimate:</span>
              <span className={calculateTotal() > project.totalCost ? "text-red-600" : "text-green-600"}>
                {calculateTotal() > project.totalCost ? "+" : ""}{formatCurrency(calculateTotal() - project.totalCost)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Message */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Message</CardTitle>
          <CardDescription>
            Write a detailed message explaining your proposal to the client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposalText">Message to Client</Label>
              <Textarea
                id="proposalText"
                placeholder="Dear [Client Name],&#10;&#10;Thank you for requesting a quote for your roof project. Based on the specifications provided, I'm pleased to present the following proposal:&#10;&#10;[Your detailed proposal message here]&#10;&#10;Please feel free to contact me if you have any questions.&#10;&#10;Best regards,&#10;[Your Name]"
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            
            {/* Proposal Summary */}
            {proposalText && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Proposal Summary</h4>
                <div className="text-sm space-y-1">
                  <div>• Project: {project.projectName}</div>
                  <div>• Proposed Cost: {formatCurrency(calculateTotal())}</div>
                  <div>• Status: <Badge variant={mode === "revise" ? "secondary" : "outline"}>
                    {mode === "revise" ? "REVISED" : "SENT"}
                  </Badge></div>
                  {mode === "revise" && (
                    <div className="text-xs text-muted-foreground mt-2">
                      This is a revision of your previous proposal
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !proposalText.trim()}>
          {loading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              {mode === "revise" ? "Revising..." : "Sending..."}
            </>
          ) : (
            <>
              <SendIcon className="mr-2 h-4 w-4" />
              {mode === "revise" ? "Send Revised Proposal" : "Send Proposal"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
