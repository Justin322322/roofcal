"use client";

/**
 * SIMPLIFIED CONTRACTOR PROJECTS COMPONENT - CURRENTLY IN USE
 * 
 * This is a simplified version of the contractor projects management
 * without warehouse integration or complex material consumption tracking.
 * 
 * CURRENT STATUS: ACTIVE - This is the component currently being used
 * 
 * Features included in this simplified version:
 * - Basic project listing and filtering
 * - Project viewing with detailed information
 * - Project actions (accept, decline, complete)
 * - Client information display
 * - Location mapping
 * - Price breakdown display
 * - Project specifications
 * 
 * Removed features (compared to original):
 * - Warehouse material integration
 * - Material consumption tracking
 * - Stock availability checking
 * - Insufficient materials handling
 * - Complex material reservation system
 * 
 * Last updated: [Current Date] - Simplified version without warehouse complexity
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusBadge } from "@/lib/badge-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2Icon,
  FileTextIcon,
  CheckIcon,
  XIcon,
  CheckCircleIcon,
  FilterIcon,
  EyeIcon,
  DollarSignIcon,
  RulerIcon,
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
  zipCode: string | null;
  createdAt: Date;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
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
  notes?: string | null;
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
}


export function ContractorProjectsContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  
  // Loading states for actions
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isHelpRequest, setIsHelpRequest] = useState(false);

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlStatusFilter = searchParams.get("status");
    const urlSearch = searchParams.get("search");
    const urlMinCost = searchParams.get("minCost");
    const urlMaxCost = searchParams.get("maxCost");
    const urlDateFrom = searchParams.get("dateFrom");
    const urlDateTo = searchParams.get("dateTo");
    const helpRequest = searchParams.get("helpRequest");

    // Set help request flag
    setIsHelpRequest(helpRequest === "true");

    // If this is a help request, default to showing projects that need attention
    if (helpRequest === "true" && !urlStatusFilter) {
      setStatusFilter("reviewing");
    } else if (urlStatusFilter) {
      setStatusFilter(urlStatusFilter);
    }
    
    if (urlSearch) setSearchQuery(urlSearch);
    if (urlMinCost) setMinCost(urlMinCost);
    if (urlMaxCost) setMaxCost(urlMaxCost);
    if (urlDateFrom) setDateFrom(urlDateFrom);
    if (urlDateTo) setDateTo(urlDateTo);
  }, [searchParams]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contractor/projects');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.projects) {
          setProjects(result.projects);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
  };

  const handleDeclineProject = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setDeclineDialogOpen(true);
  };

  const confirmDeclineProject = async () => {
    if (!selectedProjectId) return;

    setLoadingProjectId(selectedProjectId);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline project");
      }

      const result = await response.json();
      toast.success(result.message || "Project declined", {
        description: "The project has been marked as declined",
      });
      
      // Update local state instead of refreshing
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === selectedProjectId 
            ? { ...project, status: "REJECTED", proposalStatus: "REJECTED" }
            : project
        )
      );
      
      setDeclineDialogOpen(false);
      setSelectedProjectId(null);
      setDeclineReason("");
    } catch (error) {
      console.error("Failed to decline project:", error);
      toast.error("Failed to decline project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  const handleFinishProject = async (projectId: string) => {
    setLoadingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finish project");
      }

      const result = await response.json();
      toast.success(result.message || "Project completed", {
        description: "The project has been marked as completed",
      });
      
      // Update local state instead of refreshing
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: "COMPLETED", proposalStatus: "COMPLETED" }
            : project
        )
      );
    } catch (error) {
      console.error("Failed to finish project:", error);
      toast.error("Failed to finish project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  const handleAcceptProject = async (projectId: string) => {
    setLoadingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "ACCEPTED",
          proposalStatus: "ACCEPTED"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept project");
      }

      const result = await response.json();
      toast.success(result.message || "Project accepted", {
        description: "The project has been accepted and is ready to work on",
      });
      
      // Update local state instead of refreshing
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: "ACCEPTED", proposalStatus: "ACCEPTED" }
            : project
        )
      );
    } catch (error) {
      console.error("Failed to accept project:", error);
      toast.error("Failed to accept project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  const getProjectStatusBadge = (status: string, proposalStatus: string | null) => {
    // Use the same logic as filtering: prioritize proposalStatus over status
    const effectiveStatus = proposalStatus || status;
    // Pass the effective status as both status and proposalStatus so it displays correctly
    return getStatusBadge(effectiveStatus, effectiveStatus);
  };

  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== "all") {
      const projectStatus = project.proposalStatus || project.status;
      if (statusFilter === "reviewing" && projectStatus !== "CONTRACTOR_REVIEWING") return false;
      if (statusFilter === "accepted" && projectStatus !== "ACCEPTED" && projectStatus !== "ACTIVE" && projectStatus !== "DRAFT" && project.proposalStatus !== "ACCEPTED") return false;
      if (statusFilter === "completed" && projectStatus !== "COMPLETED") return false;
      if (statusFilter === "rejected" && projectStatus !== "REJECTED" && project.proposalStatus !== "REJECTED") return false;
      if (statusFilter === "archived" && projectStatus !== "ARCHIVED") return false;
    }

    // Cost filter
    if (minCost && project.totalCost < parseFloat(minCost)) return false;
    if (maxCost && project.totalCost > parseFloat(maxCost)) return false;

    // Date filter
    if (dateFrom) {
      const projectDate = new Date(project.createdAt);
      const fromDate = new Date(dateFrom);
      if (projectDate < fromDate) return false;
    }
    if (dateTo) {
      const projectDate = new Date(project.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (projectDate > toDate) return false;
    }

    // Archived filter
    const projectStatus = project.proposalStatus || project.status;
    if (!showArchived && projectStatus === "ARCHIVED") return false;
    if (showArchived && projectStatus !== "ARCHIVED") return false;

    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Manage and track your roofing projects
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileTextIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assigned Projects</h1>
            <p className="text-sm text-muted-foreground">
              {isHelpRequest 
                ? "Help request mode - showing projects that need attention"
                : "Manage and track your roofing projects"
              }
            </p>
          </div>
        </div>
        {isHelpRequest && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You&apos;re viewing projects in help request mode. Projects requiring action are highlighted.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="reviewing">Action Required</SelectItem>
                    <SelectItem value="accepted">Accepted & Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Declined</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minCost">Min Cost</Label>
                <Input
                  id="minCost"
                  type="number"
                  placeholder="₱0"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCost">Max Cost</Label>
                <Input
                  id="maxCost"
                  type="number"
                  placeholder="₱0"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showArchived"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="showArchived">Show Archived Projects</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects ({filteredProjects.length})</CardTitle>
            <CardDescription>
              Manage your roofing projects and track their progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo
                    ? "Try adjusting your filters to see more projects."
                    : "You don't have any projects yet."}
                </p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.projectName}</div>
                            <div className="text-sm text-muted-foreground">
                              {project.material} • {project.area} sqm
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.client ? (
                            <div>
                              <div className="font-medium">
                                {project.client.firstName} {project.client.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {project.client.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No client info</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getProjectStatusBadge(project.status, project.proposalStatus)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(project.totalCost)}
                        </TableCell>
                        <TableCell>
                          {formatDate(project.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProject(project)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {project.status === "CONTRACTOR_REVIEWING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAcceptProject(project.id)}
                                  disabled={loadingProjectId === project.id}
                                >
                                  {loadingProjectId === project.id ? (
                                    <>
                                      <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckIcon className="h-4 w-4 mr-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeclineProject(project.id)}
                                  disabled={loadingProjectId === project.id}
                                >
                                  <XIcon className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}
                            {(project.status === "ACCEPTED" || project.status === "ACTIVE" || project.status === "DRAFT") && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleFinishProject(project.id)}
                                disabled={loadingProjectId === project.id}
                              >
                                {loadingProjectId === project.id ? (
                                  <>
                                    <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                                    Finishing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Complete Project
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Details Sheet */}
      <Sheet open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              {selectedProject?.projectName}
            </SheetTitle>
            <SheetDescription>
              Complete project details and pricing breakdown
            </SheetDescription>
          </SheetHeader>
          
          {selectedProject && (
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
                    <div className="text-sm font-medium">{getProjectStatusBadge(selectedProject.status, selectedProject.proposalStatus)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Material</p>
                    <p className="text-sm font-medium">{selectedProject.material}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Area</p>
                    <p className="text-sm font-medium">{selectedProject.area.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{formatDate(selectedProject.createdAt)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Client Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Client Information</h3>
                </div>
                {selectedProject.client ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">{selectedProject.client.firstName} {selectedProject.client.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{selectedProject.client.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No client information available</p>
                )}
              </div>

              <Separator />

              {/* Location */}
              {(selectedProject.address || selectedProject.city || selectedProject.state || selectedProject.zipCode) && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Location</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-muted-foreground">Full Address:</span>
                        <br />
                        <span className="ml-0">
                          {[
                            selectedProject.address,
                            selectedProject.city,
                            selectedProject.state,
                            selectedProject.zipCode
                          ].filter(Boolean).join(', ')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Project Dimensions */}
              {(selectedProject.length || selectedProject.width || selectedProject.pitch) && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <RulerIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Dimensions</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedProject.length && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Length</p>
                          <p className="text-sm font-medium">{selectedProject.length} ft</p>
                        </div>
                      )}
                      {selectedProject.width && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Width</p>
                          <p className="text-sm font-medium">{selectedProject.width} ft</p>
                        </div>
                      )}
                      {selectedProject.pitch && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pitch</p>
                          <p className="text-sm font-medium">{selectedProject.pitch}°</p>
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
                      {selectedProject.materialCost !== undefined && selectedProject.materialCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>
                            Roofing Material
                            {selectedProject.area && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({selectedProject.area.toFixed(2)} sq ft)
                              </span>
                            )}
                          </span>
                          <span className="font-medium">₱{selectedProject.materialCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.gutterCost !== undefined && selectedProject.gutterCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>
                            Gutter System
                            {selectedProject.gutterPieces && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({selectedProject.gutterPieces} pieces)
                              </span>
                            )}
                          </span>
                          <span className="font-medium">₱{selectedProject.gutterCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.ridgeCost !== undefined && selectedProject.ridgeCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>
                            Ridge Cap
                            {selectedProject.ridgeLength && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({selectedProject.ridgeLength.toFixed(2)} ft)
                              </span>
                            )}
                          </span>
                          <span className="font-medium">₱{selectedProject.ridgeCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.screwsCost !== undefined && selectedProject.screwsCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Screws & Fasteners</span>
                          <span className="font-medium">₱{selectedProject.screwsCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.insulationCost !== undefined && selectedProject.insulationCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Insulation</span>
                          <span className="font-medium">₱{selectedProject.insulationCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.ventilationCost !== undefined && selectedProject.ventilationCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>
                            Ventilation
                            {selectedProject.ventilationPieces && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({selectedProject.ventilationPieces} pieces)
                              </span>
                            )}
                          </span>
                          <span className="font-medium">₱{selectedProject.ventilationCost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {selectedProject.totalMaterialsCost !== undefined && selectedProject.totalMaterialsCost > 0 && (
                      <div className="flex justify-between text-sm font-medium pt-1 border-t">
                        <span>Subtotal - Materials</span>
                        <span>₱{selectedProject.totalMaterialsCost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Labor & Services */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Labor & Services</p>
                    <div className="ml-4 space-y-1">
                      {selectedProject.laborCost !== undefined && selectedProject.laborCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Labor</span>
                          <span className="font-medium">₱{selectedProject.laborCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.removalCost !== undefined && selectedProject.removalCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Removal & Disposal</span>
                          <span className="font-medium">₱{selectedProject.removalCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.deliveryCost !== null && selectedProject.deliveryCost !== undefined && selectedProject.deliveryCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Delivery</span>
                          <span className="font-medium">₱{selectedProject.deliveryCost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Project Cost</span>
                      <span className="text-primary">₱{selectedProject.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedProject.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{selectedProject.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Decline Project Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Project</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this project. This will be shared with the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="declineReason">Reason for declining</Label>
              <Textarea
                id="declineReason"
                placeholder="Enter your reason for declining this project..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclineDialogOpen(false);
                setSelectedProjectId(null);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeclineProject}
              disabled={!declineReason.trim() || loadingProjectId === selectedProjectId}
            >
              {loadingProjectId === selectedProjectId ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Declining...
                </>
              ) : (
                <>
                  <XIcon className="h-4 w-4 mr-2" />
                  Decline Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
