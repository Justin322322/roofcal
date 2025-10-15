"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge } from "@/lib/badge-utils";
import { Separator } from "@/components/ui/separator";
import { 
  MapPinIcon, 
  FileTextIcon,
  DollarSignIcon,
  RulerIcon,
  PackageIcon,
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
  // Additional fields for detailed view
  length?: number;
  width?: number;
  pitch?: number;
  materialCost?: number;
  gutterCost?: number;
  ridgeCost?: number;
  screwsCost?: number;
  insulationCost?: number;
  ventilationCost?: number;
  totalMaterialsCost?: number;
  laborCost?: number;
  removalCost?: number;
  deliveryCost?: number | null;
  deliveryDistance?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  gutterPieces?: number;
  ridgeLength?: number;
  ventilationPieces?: number;
  // Material detail fields for print preview
  materialThickness?: string;
  ridgeType?: string;
  gutterSize?: string;
  insulationThickness?: string;
  gutterMaterial?: string;
  screwType?: string;
  insulationType?: string;
  ventilationType?: string;
  contractor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface ProjectDetailsViewerProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}


export function ProjectDetailsViewer({ project, isOpen, onClose }: ProjectDetailsViewerProps) {
  const renderStatusBadge = (status: string, proposalStatus: string | null) => {
    return getStatusBadge(status, proposalStatus ?? undefined);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{project.projectName}</SheetTitle>
          <SheetDescription>
            Complete project details and pricing breakdown
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Project Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{renderStatusBadge(project.status, project.proposalStatus)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material</p>
                <p className="text-sm font-medium capitalize">{project.material.replace(/-/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Area</p>
                <p className="text-sm font-medium">{project.area.toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contractor Information */}
          {project.contractor && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contractor Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{project.contractor.firstName} {project.contractor.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{project.contractor.email}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Location */}
          {(project.address || project.city || project.state) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Location</h3>
                </div>
                <div className="space-y-2">
                  {project.address && (
                    <p className="text-sm"><span className="font-medium text-muted-foreground">Address:</span> {project.address}</p>
                  )}
                  {(project.city || project.state) && (
                    <p className="text-sm">
                      <span className="font-medium text-muted-foreground">City/State:</span> {project.city}, {project.state}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Project Dimensions */}
          {(project.length || project.width || project.pitch) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <RulerIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dimensions</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {project.length && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Length</p>
                      <p className="text-sm font-medium">{project.length} ft</p>
                    </div>
                  )}
                  {project.width && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Width</p>
                      <p className="text-sm font-medium">{project.width} ft</p>
                    </div>
                  )}
                  {project.pitch && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pitch</p>
                      <p className="text-sm font-medium">{project.pitch}°</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Price Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Price Breakdown</h3>
            </div>
            
            <div className="space-y-3">
              {/* Material Costs */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Material Costs</p>
                <div className="ml-4 space-y-1">
                  {project.materialCost !== undefined && project.materialCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Roofing Material
                        {project.area && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.area.toFixed(2)} sq ft)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.materialCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.gutterCost !== undefined && project.gutterCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Gutter System
                        {project.gutterPieces && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.gutterPieces} pieces)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.gutterCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.ridgeCost !== undefined && project.ridgeCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Ridge Cap
                        {project.ridgeLength && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.ridgeLength.toFixed(2)} ft)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.ridgeCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.screwsCost !== undefined && project.screwsCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Screws & Fasteners</span>
                      <span className="font-medium">₱{project.screwsCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.insulationCost !== undefined && project.insulationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Insulation</span>
                      <span className="font-medium">₱{project.insulationCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.ventilationCost !== undefined && project.ventilationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Ventilation
                        {project.ventilationPieces && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.ventilationPieces} pieces)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.ventilationCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {project.totalMaterialsCost !== undefined && project.totalMaterialsCost > 0 && (
                  <div className="flex justify-between text-sm font-medium pt-1 border-t">
                    <span>Subtotal - Materials</span>
                    <span>₱{project.totalMaterialsCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Labor & Services */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Labor & Services</p>
                <div className="ml-4 space-y-1">
                  {project.laborCost !== undefined && project.laborCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Labor</span>
                      <span className="font-medium">₱{project.laborCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.removalCost !== undefined && project.removalCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Removal & Disposal</span>
                      <span className="font-medium">₱{project.removalCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.deliveryCost !== null && project.deliveryCost !== undefined && project.deliveryCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span className="font-medium">₱{project.deliveryCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Project Cost</span>
                  <span className="text-primary">₱{project.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {project.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{project.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

