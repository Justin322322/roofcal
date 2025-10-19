"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getStatusBadge } from "@/lib/badge-utils";
import { Separator } from "@/components/ui/separator";
import { 
  MapPinIcon, 
  FileTextIcon,
  DollarSignIcon,
  RulerIcon,
  PackageIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2,
  ArchiveIcon,
  CheckIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";


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
  onProjectUpdate?: () => void;
}


export function ProjectDetailsViewer({ project, isOpen, onClose, onProjectUpdate }: ProjectDetailsViewerProps) {
  const { data: session } = useSession();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const renderStatusBadge = (status: string, proposalStatus: string | null) => {
    return getStatusBadge(status, proposalStatus ?? undefined);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve project');
      }

      toast.success('Project approved successfully');
      onProjectUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to approve project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve project');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject project');
      }

      toast.success('Project rejected successfully');
      onProjectUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to reject project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject project');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete project');
      }

      toast.success('Project marked as completed');
      onProjectUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to complete project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete project');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive project');
      }

      toast.success('Project archived successfully');
      onProjectUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to archive project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to archive project');
    } finally {
      setIsArchiving(false);
    }
  };

  const showApprovalButtons = 
    (session?.user?.role === 'CLIENT' || session?.user?.role === 'ADMIN') && 
    (project.status === 'CLIENT_PENDING' || project.status === 'FOR_CLIENT_REVIEW');

  const showCompleteButton = 
    session?.user?.role === 'ADMIN' && 
    (project.status === 'ACCEPTED' || project.status === 'IN_PROGRESS' || project.status === 'ACTIVE');

  const showArchiveButton = 
    session?.user?.role === 'ADMIN' && 
    (project.status === 'COMPLETED' || project.status === 'REJECTED');

  // Debug logging
  console.log('Project Details Viewer Debug:', {
    userRole: session?.user?.role,
    projectStatus: project.status,
    showApprovalButtons,
    showCompleteButton,
    showArchiveButton
  });

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
                <p className="text-sm font-medium">{project.area.toLocaleString(undefined, { maximumFractionDigits: 2 })} sqm</p>
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
                        {project.materialThickness ? `${project.materialThickness} ${project.material.replace(/-/g, ' ')}` : `${project.material.replace(/-/g, ' ')} Roofing Material`}
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
                        {project.gutterMaterial ? `${project.gutterMaterial} Gutter` : "Gutter System"}
                        {project.gutterSize && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.gutterSize})
                          </span>
                        )}
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
                        {project.ridgeType ? `${project.ridgeType} Ridge Cap` : "Ridge Cap"}
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
                      <span>
                        {project.screwType ? `${project.screwType} Screws` : "Screws & Fasteners"}
                      </span>
                      <span className="font-medium">₱{project.screwsCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.insulationCost !== undefined && project.insulationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        {project.insulationType ? `${project.insulationType} Insulation` : "Insulation"}
                        {project.insulationThickness && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.insulationThickness})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.insulationCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.ventilationCost !== undefined && project.ventilationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        {project.ventilationType ? `${project.ventilationType} Ventilation` : "Ventilation"}
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
                      <span>
                        Delivery
                        {project.deliveryDistance !== null && project.deliveryDistance !== undefined && (
                          <span className="text-xs text-muted-foreground ml-1">({project.deliveryDistance.toLocaleString(undefined, { maximumFractionDigits: 2 })} km)</span>
                        )}
                      </span>
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

        {/* Approval Buttons for Clients/Admins */}
        {showApprovalButtons && (
          <SheetFooter className="mt-6 pt-6 border-t">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={handleReject}
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="mr-2 h-4 w-4" />
                    Reject Project
                  </>
                )}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    Approve Project
                  </>
                )}
              </Button>
            </div>
          </SheetFooter>
        )}

        {/* Complete Button for Admins (Accepted Projects) */}
        {showCompleteButton && (
          <SheetFooter className="mt-6 pt-6 border-t">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Mark as Completed
                </>
              )}
            </Button>
          </SheetFooter>
        )}

        {/* Archive Button for Admins (Completed/Rejected Projects) */}
        {showArchiveButton && (
          <SheetFooter className="mt-6 pt-6 border-t">
            <Button
              variant="outline"
              className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <ArchiveIcon className="mr-2 h-4 w-4" />
                  Archive Project
                </>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

