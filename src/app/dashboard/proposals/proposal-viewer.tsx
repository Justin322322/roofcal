"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircleIcon, CalculatorIcon, PackageIcon, DollarSignIcon, TrendingUpIcon } from "lucide-react";
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
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };


  const status = project.proposalStatus || "DRAFT";

  // Calculate slope multiplier based on pitch
  const calculateSlopeMultiplier = (pitch: number) => {
    // Simplified calculation: slope multiplier = 1 + (pitch / 100) * 0.8
    return 1 + (pitch / 100) * 0.8;
  };

  const slopeMultiplier = calculateSlopeMultiplier(Number(project.pitch));
  const baseArea = Number(project.length) * Number(project.width);
  const optimizedArea = baseArea * slopeMultiplier;

  // Material breakdown calculations
  const materialBreakdown = [
    {
      material: project.material,
      quantity: `${optimizedArea.toFixed(2)} sq.m`,
      unitCost: formatCurrency(Number(project.materialCost) / optimizedArea),
      subtotal: formatCurrency(Number(project.materialCost)),
    },
    {
      material: "Ridge Cap",
      quantity: `${Number(project.ridgeLength).toFixed(1)} m`,
      unitCost: formatCurrency(Number(project.ridgeCost) / Number(project.ridgeLength)),
      subtotal: formatCurrency(Number(project.ridgeCost)),
    },
    {
      material: "Screws",
      quantity: `${Math.ceil(optimizedArea * 10)} pcs (10 pcs/m²)`,
      unitCost: formatCurrency(Number(project.screwsCost) / (optimizedArea * 10)),
      subtotal: formatCurrency(Number(project.screwsCost)),
    },
    {
      material: "Insulation",
      quantity: `${optimizedArea.toFixed(2)} sq.m`,
      unitCost: formatCurrency(Number(project.insulationCost) / optimizedArea),
      subtotal: formatCurrency(Number(project.insulationCost)),
    },
  ];

  const totalMaterials = Number(project.materialCost) + Number(project.ridgeCost) + 
                        Number(project.screwsCost) + Number(project.insulationCost);

  // Additional costs
  const laborPercentage = (Number(project.laborCost) / totalMaterials) * 100;
  const removalPercentage = project.removalCost > 0 ? (Number(project.removalCost) / totalMaterials) * 100 : 0;

  // Budget comparison
  const clientBudget = Number(project.budgetAmount) || 0;
  const remainingFunds = clientBudget - Number(project.totalCost);
  const budgetStatus = remainingFunds >= 0 ? "sufficient" : "insufficient";

  return (
    <div className="space-y-8">
      {/* Proposal Header */}
      <Card className="border-2">
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-primary">{project.projectName}</CardTitle>
              <CardDescription className="text-lg">Professional Roofing Proposal</CardDescription>
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
              <div className="text-lg font-medium">{project.clientName || "Unknown"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Proposal Date</div>
              <div className="text-lg">{formatDate(project.proposalSent || project.created_at)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Calculation Results */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Calculation Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Roof Type</div>
              <div className="text-lg font-medium">{project.roofType}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Pitch Angle</div>
              <div className="text-lg font-medium">{project.pitch}° (adds +{((slopeMultiplier - 1) * 100).toFixed(0)}% slope area)</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Base Area</div>
              <div className="text-lg font-medium">{project.length}m × {project.width}m = {baseArea.toFixed(1)} m²</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Slope Multiplier</div>
              <div className="text-lg font-medium">{slopeMultiplier.toFixed(2)}×</div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Optimized Roof Area</span>
              <span className="text-2xl font-bold text-primary">{optimizedArea.toFixed(2)} m²</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Material Breakdown */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Material Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Material</TableHead>
                <TableHead className="font-semibold">Quantity / Details</TableHead>
                <TableHead className="font-semibold text-right">Unit Cost</TableHead>
                <TableHead className="font-semibold text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialBreakdown.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.material}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.unitCost}</TableCell>
                  <TableCell className="text-right font-semibold">{item.subtotal}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell colSpan={3} className="font-bold text-lg">Total Materials</TableCell>
                <TableCell className="text-right font-bold text-lg">{formatCurrency(totalMaterials)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: Additional Costs */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Additional Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Cost Type</TableHead>
                <TableHead className="font-semibold text-right">Rate</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Labor Cost</TableCell>
                <TableCell className="text-right">{laborPercentage.toFixed(0)}%</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(Number(project.laborCost))}</TableCell>
              </TableRow>
              {project.removalCost > 0 && (
                <TableRow>
                  <TableCell className="font-medium">Removal Cost</TableCell>
                  <TableCell className="text-right">{removalPercentage.toFixed(0)}%</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(project.removalCost))}</TableCell>
                </TableRow>
              )}
              <TableRow className="border-t-2">
                <TableCell colSpan={2} className="font-bold text-lg">Total Estimate</TableCell>
                <TableCell className="text-right font-bold text-lg">{formatCurrency(Number(project.totalCost))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 4: Budget Comparison */}
      {clientBudget > 0 && (
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Budget Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Your Budget</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(clientBudget)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Remaining Funds</TableCell>
                  <TableCell className={`text-right font-semibold ${remainingFunds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(remainingFunds)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 p-4 rounded-lg border-2">
              <div className={`flex items-center gap-2 ${budgetStatus === 'sufficient' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-semibold">
                  {budgetStatus === 'sufficient' 
                    ? 'Budget is sufficient with contingency funds.' 
                    : 'Budget exceeds client allocation.'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Specifications */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Project Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Construction Mode</div>
              <div className="text-base font-medium">{project.constructionMode}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Material Thickness</div>
              <div className="text-base font-medium">{project.materialThickness}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Ridge Type</div>
              <div className="text-base font-medium">{project.ridgeType}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Gutter Size</div>
              <div className="text-base font-medium">{project.gutterSize}</div>
            </div>
          </div>
          {project.notes && (
            <>
              <Separator className="my-6" />
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Additional Notes</div>
                <div className="text-base whitespace-pre-wrap">{project.notes}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {status === "SENT" && (
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-8">
            <Alert className="mb-8">
              <AlertDescription className="text-base">
                This proposal is waiting for your response. Please review the detailed breakdown above and either accept or reject the proposal.
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
        <Alert className="border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-base text-green-700">
            This proposal has been accepted. The project is now ready to begin.
          </AlertDescription>
        </Alert>
      )}

      {status === "REJECTED" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-base text-red-700">
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