"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge } from "@/lib/badge-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2Icon,
  EyeIcon,
  CalendarIcon,
  MapPinIcon,
  EditIcon,
  ArchiveIcon,
  PrinterIcon,
  MoreHorizontalIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SendIcon,
  UserCheckIcon,
  FilterIcon,
  XCircleIcon,
} from "lucide-react";
import { formatCurrency, formatArea } from "@/lib/utils";
import { ProposalViewer } from "./proposal-viewer";
import { ProjectDetailsViewer } from "./project-details-viewer";
import { ProjectEditor } from "./project-editor";
import { ProjectPrinter } from "./project-printer";

interface Project {
  id: string;
  projectName: string;
  status: string;
  proposalStatus: string | null;
  contractorId: string | null;
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
  // Admin creation tracking
  createdByAdmin?: boolean;
  adminName?: string;
}

type SortField = "projectName" | "material" | "area" | "totalCost" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  completedProjects: number;
  joinedDate: Date;
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorDialogOpen, setContractorDialogOpen] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [sendingToContractor, setSendingToContractor] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingProjectId, setArchivingProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/contractors');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.contractors) {
          setContractors(result.contractors);
        }
      }
    } catch (error) {
      console.error("Failed to fetch contractors:", error);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/projects?t=${Date.now()}`);
      console.log('Projects API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Projects API result:', result);
        
        if (result.success && result.projects) {
          // Convert Decimal fields to numbers for display
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedProjects = result.projects.map((p: any) => ({
            ...p,
            totalCost: Number(p.totalCost),
            area: Number(p.area),
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          }));
          console.log('Formatted projects:', formattedProjects);
          console.log('Project status details:', formattedProjects.map((p: Project) => ({ 
            id: p.id, 
            name: p.projectName, 
            status: p.status, 
            contractorId: p.contractorId,
            proposalStatus: p.proposalStatus 
          })));
          setProjects(formattedProjects);
          
          if (formattedProjects.length === 0) {
            toast.info("No projects found", {
              description: "You haven't created any projects yet. Use the roof calculator to get started.",
            });
          }
        } else {
          console.log('No projects found or API returned error:', result);
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    setArchivingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to archive project');

      toast.success('Project archived successfully');
      fetchProjects();
    } catch (error) {
      console.error('Failed to archive project:', error);
      toast.error('Failed to archive project');
    } finally {
      setArchivingProjectId(null);
    }
  };

  const handleUnarchiveProject = async (projectId: string) => {
    setArchivingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unarchive: true }),
      });

      if (!response.ok) throw new Error('Failed to unarchive project');

      toast.success('Project unarchived successfully');
      fetchProjects();
    } catch (error) {
      console.error('Failed to unarchive project:', error);
      toast.error('Failed to unarchive project');
    } finally {
      setArchivingProjectId(null);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve project');
      }

      toast.success('Project approved successfully');
      fetchProjects();
    } catch (error) {
      console.error('Failed to approve project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve project');
    }
  };

  const handleRejectProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject project');
      }

      toast.success('Project rejected successfully');
      fetchProjects();
    } catch (error) {
      console.error('Failed to reject project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject project');
    }
  };


  const getProjectStatusBadge = (status: string, proposalStatus: string | null) => {
    return getStatusBadge(status, proposalStatus ?? undefined);
  };

  const filteredProjects = projects.filter(project => {
    // Archive filter
    if (!showArchived && project.status === "ARCHIVED") return false;
    if (showArchived && project.status !== "ARCHIVED") return false;

    // Search filter
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.address && project.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Status filter (skip for archived projects)
    if (statusFilter !== "all" && project.status !== "ARCHIVED") {
      const matchesStatus = project.status === statusFilter || 
                           (statusFilter === "proposal" && project.proposalStatus === "SENT");
      if (!matchesStatus) return false;
    }

    // Cost filter
    if (minCost && project.totalCost < parseFloat(minCost)) return false;
    if (maxCost && project.totalCost > parseFloat(maxCost)) return false;

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const projectDate = new Date(project.createdAt);
      if (projectDate < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const projectDate = new Date(project.createdAt);
      if (projectDate > toDate) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMinCost("");
    setMaxCost("");
    setDateFrom("");
    setDateTo("");
    setShowArchived(false);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo;

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "projectName":
        aValue = a.projectName.toLowerCase();
        bValue = b.projectName.toLowerCase();
        break;
      case "material":
        aValue = a.material.toLowerCase();
        bValue = b.material.toLowerCase();
        break;
      case "area":
        aValue = a.area;
        bValue = b.area;
        break;
      case "totalCost":
        aValue = a.totalCost;
        bValue = b.totalCost;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDownIcon className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };


  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search projects by name, material, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="CLIENT_PENDING">Pending Approval</SelectItem>
                    <SelectItem value="FOR_CLIENT_REVIEW">For Client Review</SelectItem>
                    <SelectItem value="CONTRACTOR_REVIEWING">Under Review</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Declined</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Cost */}
              <div>
                <label className="text-sm font-medium mb-2 block">Min Cost</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                />
              </div>

              {/* Max Cost */}
              <div>
                <label className="text-sm font-medium mb-2 block">Max Cost</label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                />
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
            </div>

            {/* Date To */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>



            {/* Clear Filters Button */}
            {(hasActiveFilters || showArchived) && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''} found
                {hasActiveFilters && (
                  <span className="ml-2 text-primary">
                    (filtered from {projects.length} total)
                  </span>
                )}
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FilterIcon className="h-3 w-3" />
                {[
                  searchQuery && "Search",
                  statusFilter !== "all" && "Status",
                  minCost && "Min Cost",
                  maxCost && "Max Cost",
                  dateFrom && "From Date",
                  dateTo && "To Date",
                ].filter(Boolean).length} active filter{[
                  searchQuery && "Search",
                  statusFilter !== "all" && "Status",
                  minCost && "Min Cost",
                  maxCost && "Max Cost",
                  dateFrom && "From Date",
                  dateTo && "To Date",
                ].filter(Boolean).length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("projectName")}
                  >
                    <div className="flex items-center">
                      Project Name
                      {getSortIcon("projectName")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("material")}
                  >
                    <div className="flex items-center">
                      Material
                      {getSortIcon("material")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("area")}
                  >
                    <div className="flex items-center">
                      Area
                      {getSortIcon("area")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("totalCost")}
                  >
                    <div className="flex items-center">
                      Est. Cost
                      {getSortIcon("totalCost")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Created
                      {getSortIcon("createdAt")}
                    </div>
                  </TableHead>
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
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{project.projectName}</div>
                      {project.address && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPinIcon className="h-3 w-3" />
                          {project.address}, {project.city}, {project.state}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{project.material}</TableCell>
                  <TableCell>{formatArea(project.area)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(project.totalCost)}</TableCell>
                  <TableCell>{getProjectStatusBadge(project.status, project.proposalStatus)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      {project.createdAt instanceof Date && !isNaN(project.createdAt.getTime()) 
                        ? project.createdAt.toLocaleDateString()
                        : new Date(project.createdAt).toLocaleDateString()
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                        {project.status === "DRAFT" && !project.contractorId && !project.createdByAdmin && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProject(project);
                              setContractorDialogOpen(true);
                            }}
                          >
                            <SendIcon className="mr-2 h-4 w-4" />
                            Send to Contractor
                          </DropdownMenuItem>
                        )}
                        {(project.status === "CLIENT_PENDING" || project.status === "FOR_CLIENT_REVIEW") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApproveProject(project.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <UserCheckIcon className="mr-2 h-4 w-4" />
                              Approve Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRejectProject(project.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircleIcon className="mr-2 h-4 w-4" />
                              Reject Project
                            </DropdownMenuItem>
                          </>
                        )}
                        {project.status === "ARCHIVED" ? (
                          <DropdownMenuItem
                            onClick={() => handleUnarchiveProject(project.id)}
                            disabled={archivingProjectId === project.id}
                          >
                            <ArchiveIcon className="mr-2 h-4 w-4" />
                            {archivingProjectId === project.id ? "Unarchiving..." : "Unarchive"}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleArchiveProject(project.id)}
                            disabled={archivingProjectId === project.id}
                          >
                            <ArchiveIcon className="mr-2 h-4 w-4" />
                            {archivingProjectId === project.id ? "Archiving..." : "Archive"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setPrintDialogOpen(true);
                          }}
                        >
                          <PrinterIcon className="mr-2 h-4 w-4" />
                          Print
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!isLoading && sortedProjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {hasActiveFilters
              ? "No projects match your current filters."
              : "You haven't created any projects yet. Use the roof calculator to get started."}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Proposal Viewer */}
      {selectedProject && (
        <ProposalViewer
          project={selectedProject}
          isOpen={proposalDialogOpen}
          onClose={() => {
            setProposalDialogOpen(false);
            setSelectedProject(null);
          }}
          onProposalResponse={() => {
            fetchProjects(); // Refresh the project list
          }}
        />
      )}

      {/* View Project Details Dialog */}
      {selectedProject && (
        <ProjectDetailsViewer
          project={selectedProject}
          isOpen={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Edit Project Dialog */}
      {selectedProject && (
        <ProjectEditor
          project={selectedProject}
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedProject(null);
          }}
          onSave={() => {
            fetchProjects(); // Refresh the project list
          }}
        />
      )}

      {/* Print Dialog */}
      {selectedProject && (
        <ProjectPrinter
          project={selectedProject}
          isOpen={printDialogOpen}
          onClose={() => {
            setPrintDialogOpen(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Contractor Selection Dialog */}
      {selectedProject && (
        <Dialog open={contractorDialogOpen} onOpenChange={setContractorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Contractor</DialogTitle>
              <DialogDescription>
                Choose a contractor to send this project to for review and proposal creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {contractors.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No contractors available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="contractor">Select Contractor</Label>
                  <Select
                    value={selectedContractorId}
                    onValueChange={setSelectedContractorId}
                  >
                    <SelectTrigger id="contractor" className="w-full">
                      <SelectValue placeholder="Choose a contractor...">
                        {selectedContractorId && contractors.length > 0 && (() => {
                          const contractor = contractors.find(c => c.id === selectedContractorId);
                          return contractor ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-medium text-sm">
                                {contractor.companyName || `${contractor.firstName} ${contractor.lastName}`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {contractor.completedProjects} completed project{contractor.completedProjects !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : "Choose a contractor...";
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm">
                              {contractor.companyName || `${contractor.firstName} ${contractor.lastName}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {contractor.completedProjects} completed project{contractor.completedProjects !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setContractorDialogOpen(false);
                  setSelectedProject(null);
                  setSelectedContractorId("");
                }}
                disabled={sendingToContractor}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedContractorId) {
                    toast.error("Please select a contractor");
                    return;
                  }

                  setSendingToContractor(true);
                  try {
                    const response = await fetch(
                      `/api/projects/${selectedProject.id}/send-to-contractor`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          contractorId: selectedContractorId,
                          note: "Project sent for review",
                        }),
                      }
                    );

                    if (!response.ok) throw new Error("Failed to send to contractor");

                    const result = await response.json();
                    console.log('Send to contractor response:', result);
                    
                    toast.success("Project sent to contractor successfully");
                    
                    // Force immediate refresh with cache busting
                    console.log('About to refresh projects after send-to-contractor');
                    await fetchProjects();
                    
                    // Force another refresh after a short delay to ensure database consistency
                    setTimeout(async () => {
                      console.log('Second refresh after send-to-contractor');
                      await fetchProjects();
                    }, 1000);
                    
                    setContractorDialogOpen(false);
                    setSelectedProject(null);
                    setSelectedContractorId("");
                  } catch (error) {
                    console.error("Failed to send to contractor:", error);
                    toast.error("Failed to send project to contractor");
                  } finally {
                    setSendingToContractor(false);
                  }
                }}
                disabled={!selectedContractorId || sendingToContractor}
              >
                {sendingToContractor ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send Project
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
