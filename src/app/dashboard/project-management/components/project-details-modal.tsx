"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, EqualIcon } from "lucide-react";
import type { Project } from "@/types/project";
import { materials } from "@/app/dashboard/roof-calculator/components/material-selection";

const getMaterialDisplayName = (materialKey: string): string => {
  const material = materials.find((m) => m.value === materialKey);
  return material ? material.name : materialKey;
};

interface ProjectDetailsModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsModal({
  project,
  open,
  onOpenChange,
}: ProjectDetailsModalProps) {
  if (!project) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default" as const;
      case "COMPLETED":
        return "secondary" as const;
      case "DRAFT":
        return "outline" as const;
      case "ARCHIVED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight">
              {project.projectName}
            </DialogTitle>
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.area.toFixed(1)} m²
                </div>
                <p className="text-xs text-muted-foreground">Total roof area</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(project.totalCost)}
                </div>
                <p className="text-xs text-muted-foreground">Estimated total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pitch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.pitch}°</div>
                <p className="text-xs text-muted-foreground">Roof slope</p>
              </CardContent>
            </Card>
          </div>

          {/* Material Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Material Selection</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose your preferred roofing material
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Roofing Material</p>
                <p className="text-lg font-semibold text-primary">
                  {getMaterialDisplayName(project.material)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cost-effective and durable, 15-30 year lifespan
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Price per sq.m</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(project.totalMaterialsCost / project.area)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Specifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Budget, thickness, ridge & gutter specifications
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.materialThickness ||
              project.ridgeType ||
              project.gutterSize ? (
                <>
                  {project.materialThickness && (
                    <div>
                      <p className="text-sm font-medium">Material Thickness</p>
                      <p className="text-sm text-muted-foreground">
                        {project.materialThickness}
                      </p>
                    </div>
                  )}
                  {project.ridgeType && (
                    <div>
                      <p className="text-sm font-medium">Ridge Type</p>
                      <p className="text-sm text-muted-foreground">
                        {project.ridgeType}
                      </p>
                    </div>
                  )}
                  {project.gutterSize && (
                    <div>
                      <p className="text-sm font-medium">Gutter Size</p>
                      <p className="text-sm text-muted-foreground">
                        {project.gutterSize}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional specifications provided
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm text-muted-foreground">
                  {project.clientName || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Construction Mode</p>
                <p className="text-sm text-muted-foreground">
                  {project.constructionMode}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(project.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">
                  {project.roofType}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Floors</p>
                <p className="text-sm text-muted-foreground">
                  {project.floors}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Dimensions</p>
                <p className="text-sm text-muted-foreground">
                  {project.length}m × {project.width}m
                </p>
              </div>
              {project.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {project.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Materials</span>
                <span className="text-sm font-medium">
                  {formatCurrency(project.totalMaterialsCost)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Labor</span>
                <div className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {formatCurrency(project.laborCost)}
                  </span>
                </div>
              </div>
              {project.removalCost > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Removal
                    </span>
                    <div className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {formatCurrency(project.removalCost)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2 bg-muted/50 -mx-6 px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total Cost</span>
                  <div className="flex items-center gap-2">
                    <EqualIcon className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(project.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
