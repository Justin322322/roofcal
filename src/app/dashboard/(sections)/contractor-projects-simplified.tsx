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

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusBadge } from "@/lib/badge-utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Archive,
  RefreshCw,
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
  
  // Loading states for actions
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isHelpRequest, setIsHelpRequest] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<string | null>(null);

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
    } else {
      // Default to all when no status filter is provided
      setStatusFilter("all");
    }
    
    if (urlSearch) setSearchQuery(urlSearch);
    if (urlMinCost) setMinCost(urlMinCost);
    if (urlMaxCost) setMaxCost(urlMaxCost);
    if (urlDateFrom) setDateFrom(urlDateFrom);
    if (urlDateTo) setDateTo(urlDateTo);
  }, [searchParams]);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all projects without server-side filtering to prevent reloads
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
  }, []);

  // Only fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // Include fetchProjects to satisfy linter

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

  const handleStartWork = async (projectId: string) => {
    setLoadingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "IN_PROGRESS"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start work");
      }

      const result = await response.json();
      toast.success(result.message || "Work started", {
        description: "The project is now in progress",
      });
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: "IN_PROGRESS" }
            : project
        )
      );
    } catch (error) {
      console.error("Failed to start work:", error);
      toast.error("Failed to start work", {
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

  const handleArchiveProject = async (projectId: string) => {
    setLoadingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to archive project");
      }

      const result = await response.json();
      toast.success(result.message || "Project archived", {
        description: "The project has been archived and can be filtered later",
      });
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: "ARCHIVED" }
            : project
        )
      );
      
      // Close dialog
      setArchiveDialogOpen(false);
      setProjectToArchive(null);
    } catch (error) {
      console.error("Failed to archive project:", error);
      toast.error("Failed to archive project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  const getProjectStatusBadge = (status: string, proposalStatus: string | null) => {
    // Use the centralized getStatusBadge utility
    return getStatusBadge(status, proposalStatus ?? undefined);
  };

  const filteredProjects = projects.filter(project => {
    // Exclude archived projects from contractor view
    if (project.status === "ARCHIVED") return false;
    
    // Exclude completed and rejected projects from contractor assigned projects view
    const projectStatus = project.proposalStatus || project.status;
    if (projectStatus === "COMPLETED" || projectStatus === "REJECTED") return false;
    
    // Search filter
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    
    // Apply specific status filter
    if (statusFilter !== "all") {
      if (statusFilter === "draft" && projectStatus !== "DRAFT") return false;
      if (statusFilter === "reviewing" && projectStatus !== "CONTRACTOR_REVIEWING") return false;
      if (statusFilter === "client-review" && projectStatus !== "FOR_CLIENT_REVIEW") return false;
      if (statusFilter === "accepted" && projectStatus !== "ACCEPTED" && projectStatus !== "ACTIVE" && project.proposalStatus !== "ACCEPTED") return false;
      if (statusFilter === "in-progress" && projectStatus !== "IN_PROGRESS") return false;
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

    // Archived projects are now excluded in the main status filter above

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
        <div className="flex items-center justify-between">
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="reviewing">Under Review</SelectItem>
                    <SelectItem value="client-review">Awaiting Client</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-36 mt-1" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredProjects.map((project) => (
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
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProject(project)}>
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {project.status === "CONTRACTOR_REVIEWING" && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleAcceptProject(project.id)}
                                    disabled={loadingProjectId === project.id}
                                  >
                                    <CheckIcon className="h-4 w-4 mr-2" />
                                    Accept Project
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeclineProject(project.id)}
                                    disabled={loadingProjectId === project.id}
                                    className="text-red-600"
                                  >
                                    <XIcon className="h-4 w-4 mr-2" />
                                    Decline Project
                                  </DropdownMenuItem>
                                </>
                              )}
                              {project.status === "ACCEPTED" && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleStartWork(project.id)}
                                    disabled={loadingProjectId === project.id}
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    Start Work
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleFinishProject(project.id)}
                                    disabled={loadingProjectId === project.id}
                                    className="text-orange-600"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    Complete Project
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(project.status === "IN_PROGRESS" || project.status === "ACTIVE" || project.status === "DRAFT") && (
                                <DropdownMenuItem 
                                  onClick={() => handleFinishProject(project.id)}
                                  disabled={loadingProjectId === project.id}
                                >
                                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                                  Complete Project
                                </DropdownMenuItem>
                              )}
                              {project.status === "COMPLETED" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setProjectToArchive(project.id);
                                    setArchiveDialogOpen(true);
                                  }}
                                  className="text-orange-600"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive Project
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!isLoading && filteredProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo
                    ? "No projects match your current filters."
                    : "You don't have any projects yet."}
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

              {/* Action Buttons */}
              {selectedProject.status === "CONTRACTOR_REVIEWING" && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleAcceptProject(selectedProject.id);
                      }}
                      disabled={loadingProjectId === selectedProject.id}
                      className="flex-1"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Accept Project
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleDeclineProject(selectedProject.id);
                      }}
                      disabled={loadingProjectId === selectedProject.id}
                      className="flex-1"
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Decline Project
                    </Button>
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

      {/* Archive Project Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this project? Archived projects can be filtered and viewed later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setArchiveDialogOpen(false);
                setProjectToArchive(null);
              }}
              disabled={loadingProjectId === projectToArchive}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (projectToArchive) {
                  handleArchiveProject(projectToArchive);
                }
              }}
              disabled={loadingProjectId === projectToArchive}
            >
              {loadingProjectId === projectToArchive ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
