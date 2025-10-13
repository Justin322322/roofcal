"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2Icon,
  FileTextIcon,
  SendIcon,
  SaveIcon,
  CalculatorIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
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
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  materialCost: number;
  laborCost: number;
  deliveryCost: number | null;
  length: number;
  width: number;
  pitch: number;
  roofType: string;
  floors: number;
  notes: string | null;
}

interface ProposalBuilderProps {
  project: Project;
  onProposalSent?: () => void;
}

interface ProposalData {
  customMaterialCost?: number;
  customLaborCost?: number;
  customDeliveryCost?: number;
  additionalLineItems: Array<{
    description: string;
    amount: number;
  }>;
  totalAmount: number;
  validityDays: number;
  notes: string;
}

export function ProposalBuilder({ project, onProposalSent }: ProposalBuilderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [proposalData, setProposalData] = useState<ProposalData>({
    customMaterialCost: project.materialCost,
    customLaborCost: project.laborCost,
    customDeliveryCost: project.deliveryCost || undefined,
    additionalLineItems: [],
    totalAmount: project.totalCost,
    validityDays: 30,
    notes: "",
  });

  const [newLineItem, setNewLineItem] = useState({ description: "", amount: "" });

  const calculateTotal = () => {
    const material = proposalData.customMaterialCost || project.materialCost;
    const labor = proposalData.customLaborCost || project.laborCost;
    const delivery = proposalData.customDeliveryCost || project.deliveryCost || 0;
    const additional = proposalData.additionalLineItems.reduce((sum, item) => sum + item.amount, 0);
    
    return material + labor + delivery + additional;
  };

  const handleAddLineItem = () => {
    if (!newLineItem.description.trim() || !newLineItem.amount) return;
    
    const amount = parseFloat(newLineItem.amount);
    if (isNaN(amount)) return;

    setProposalData(prev => ({
      ...prev,
      additionalLineItems: [
        ...prev.additionalLineItems,
        { description: newLineItem.description, amount }
      ],
    }));
    
    setNewLineItem({ description: "", amount: "" });
  };

  const handleRemoveLineItem = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      additionalLineItems: prev.additionalLineItems.filter((_, i) => i !== index),
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          customMaterialCost: proposalData.customMaterialCost,
          customLaborCost: proposalData.customLaborCost,
          customDeliveryCost: proposalData.customDeliveryCost,
          additionalLineItems: proposalData.additionalLineItems,
          totalAmount: calculateTotal(),
          validityDays: proposalData.validityDays,
          notes: proposalData.notes,
          status: 'DRAFT',
        }),
      });

      if (response.ok) {
        toast.success("Proposal draft saved successfully");
      } else {
        const error = await response.json();
        toast.error("Failed to save draft", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Failed to save draft", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendProposal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          customMaterialCost: proposalData.customMaterialCost,
          customLaborCost: proposalData.customLaborCost,
          customDeliveryCost: proposalData.customDeliveryCost,
          additionalLineItems: proposalData.additionalLineItems,
          totalAmount: calculateTotal(),
          validityDays: proposalData.validityDays,
          notes: proposalData.notes,
          status: 'SENT',
        }),
      });

      if (response.ok) {
        toast.success("Proposal sent successfully", {
          description: "The client has been notified and can now review your proposal",
        });
        onProposalSent?.();
      } else {
        const error = await response.json();
        toast.error("Failed to send proposal", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Failed to send proposal", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = calculateTotal();
  const originalTotal = project.totalCost;
  const difference = totalAmount - originalTotal;

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Client:</span>
                <span>{project.client.firstName} {project.client.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{project.address}, {project.city}, {project.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Project Date:</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div><span className="font-medium">Material:</span> {project.material}</div>
              <div><span className="font-medium">Area:</span> {project.area.toFixed(2)} m²</div>
              <div><span className="font-medium">Roof Type:</span> {project.roofType}</div>
              <div><span className="font-medium">Dimensions:</span> {project.length}m × {project.width}m</div>
            </div>
          </div>
          
          {project.notes && (
            <div>
              <span className="font-medium">Client Notes:</span>
              <p className="text-sm text-muted-foreground mt-1">{project.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Proposal Pricing
          </CardTitle>
          <CardDescription>
            Customize the pricing for this proposal. The client&apos;s original estimate is shown for reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Material Cost */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="materialCost">Material Cost</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="materialCost"
                  type="number"
                  value={proposalData.customMaterialCost || ""}
                  onChange={(e) => setProposalData(prev => ({
                    ...prev,
                    customMaterialCost: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))}
                  placeholder={project.materialCost.toString()}
                />
                <Badge variant="outline" className="px-2">
                  Original: ₱{project.materialCost.toFixed(2)}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label htmlFor="laborCost">Labor Cost</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="laborCost"
                  type="number"
                  value={proposalData.customLaborCost || ""}
                  onChange={(e) => setProposalData(prev => ({
                    ...prev,
                    customLaborCost: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))}
                  placeholder={project.laborCost.toString()}
                />
                <Badge variant="outline" className="px-2">
                  Original: ₱{project.laborCost.toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Delivery Cost */}
          <div>
            <Label htmlFor="deliveryCost">Delivery Cost</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="deliveryCost"
                type="number"
                value={proposalData.customDeliveryCost || ""}
                onChange={(e) => setProposalData(prev => ({
                  ...prev,
                  customDeliveryCost: e.target.value ? parseFloat(e.target.value) : undefined,
                }))}
                placeholder={project.deliveryCost?.toString() || "0"}
              />
              <Badge variant="outline" className="px-2">
                Original: ₱{project.deliveryCost?.toFixed(2) || "0.00"}
              </Badge>
            </div>
          </div>

          {/* Additional Line Items */}
          <div>
            <Label>Additional Line Items</Label>
            <div className="space-y-2 mt-2">
              {proposalData.additionalLineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={item.description}
                    readOnly
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₱{item.amount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLineItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Description (e.g., Additional flashing, Extra materials)"
                  value={newLineItem.description}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  value={newLineItem.amount}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-24"
                />
                <Button onClick={handleAddLineItem} disabled={!newLineItem.description || !newLineItem.amount}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Total Calculation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Original Estimate:</span>
              <span>₱{originalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Proposal Total:</span>
              <span className="text-lg font-bold">₱{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Difference:</span>
              <span className={difference >= 0 ? "text-green-600" : "text-red-600"}>
                {difference >= 0 ? "+" : ""}₱{difference.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="validityDays">Validity Period (days)</Label>
            <Input
              id="validityDays"
              type="number"
              value={proposalData.validityDays}
              onChange={(e) => setProposalData(prev => ({
                ...prev,
                validityDays: parseInt(e.target.value) || 30,
              }))}
              className="mt-1"
              min="1"
              max="90"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes for Client</Label>
            <Textarea
              id="notes"
              value={proposalData.notes}
              onChange={(e) => setProposalData(prev => ({
                ...prev,
                notes: e.target.value,
              }))}
              placeholder="Include any terms, conditions, or additional information for the client..."
              className="mt-1"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving || isLoading}
        >
          {isSaving && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
          <SaveIcon className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          onClick={handleSendProposal}
          disabled={isSaving || isLoading}
        >
          {isLoading && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
          <SendIcon className="h-4 w-4 mr-2" />
          Send Proposal
        </Button>
      </div>
    </div>
  );
}
