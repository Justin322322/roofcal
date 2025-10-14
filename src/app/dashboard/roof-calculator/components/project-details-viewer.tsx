"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatArea } from "@/lib/utils";
import { CalendarIcon, MapPinIcon, UserIcon, FileTextIcon } from "lucide-react";

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
  materialCost?: number;
  laborCost?: number;
  deliveryCost?: number;
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
  const getStatusBadge = (status: string, proposalStatus: string | null) => {
    if (proposalStatus === "SENT") {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Proposal Sent</Badge>;
    }
    if (proposalStatus === "ACCEPTED") {
      return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
    }
    if (proposalStatus === "REJECTED") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CLIENT_PENDING":
        return <Badge variant="outline">Pending Contractor</Badge>;
      case "CONTRACTOR_REVIEWING":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case "ACCEPTED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Completed</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Project Details
          </DialogTitle>
          <DialogDescription>
            Complete information about your roofing project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{project.projectName}</h3>
              {project.address && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{project.address}, {project.city}, {project.state}</span>
                </div>
              )}
            </div>
            {getStatusBadge(project.status, project.proposalStatus)}
          </div>

          <Separator />

          {/* Project Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Material</div>
                  <div className="capitalize">{project.material}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Roof Area</div>
                  <div>{formatArea(project.area)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created Date</div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {project.createdAt instanceof Date && !isNaN(project.createdAt.getTime()) 
                      ? project.createdAt.toLocaleDateString()
                      : new Date(project.createdAt).toLocaleDateString()
                    }
                  </div>
                </div>
                {project.proposalSent && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Proposal Sent</div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(project.proposalSent).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.materialCost !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Material Cost</span>
                    <span className="font-medium">{formatCurrency(project.materialCost)}</span>
                  </div>
                )}
                {project.laborCost !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Labor Cost</span>
                    <span className="font-medium">{formatCurrency(project.laborCost)}</span>
                  </div>
                )}
                {project.deliveryCost !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Cost</span>
                    <span className="font-medium">{formatCurrency(project.deliveryCost)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Cost</span>
                  <span>{formatCurrency(project.totalCost)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contractor Information */}
          {project.contractor && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contractor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{project.contractor.firstName} {project.contractor.lastName}</div>
                    <div className="text-sm text-muted-foreground">{project.contractor.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {project.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

