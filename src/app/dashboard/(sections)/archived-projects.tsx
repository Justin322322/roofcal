"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Loader2Icon,
  EyeIcon,
  CalendarIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FilterIcon,
  XCircleIcon,
  ArchiveIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { formatCurrency, formatArea } from "@/lib/utils";
import { ProjectDetailsViewer } from "../roof-calculator/components/project-details-viewer";

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
}

type SortField = "projectName" | "material" | "area" | "totalCost" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

export default function ArchivedProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [projectToUnarchive, setProjectToUnarchive] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState(false);

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  const fetchArchivedProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects/archived');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.projects) {
          // Convert Decimal fields to numbers for display
          const formattedProjects = result.projects.map((p: Project) => ({
            ...p,
            totalCost: Number(p.totalCost),
            area: Number(p.area),
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          }));
          setProjects(formattedProjects);
          
          if (formattedProjects.length === 0) {
            toast.info("No archived projects found", {
              description: "You don't have any archived projects yet.",
            });
          }
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        toast.error("Failed to load archived projects");
      }
    } catch (error) {
      console.error("Failed to fetch archived projects:", error);
      toast.error("Failed to load archived projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
  };

  const handleUnarchive = (projectId: string) => {
    setProjectToUnarchive(projectId);
    setUnarchiveDialogOpen(true);
  };

  const confirmUnarchive = async () => {
    if (!projectToUnarchive) return;

    setUnarchiving(true);
    try {
      const response = await fetch(`/api/projects/${projectToUnarchive}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unarchive: true }),
      });

      if (!response.ok) throw new Error('Failed to unarchive project');

      toast.success('Project unarchived successfully');
      setUnarchiveDialogOpen(false);
      setProjectToUnarchive(null);
      fetchArchivedProjects();
    } catch (error) {
      console.error('Failed to unarchive project:', error);
      toast.error('Failed to unarchive project');
    } finally {
      setUnarchiving(false);
    }
  };

  const getStatusBadge = (status: string, proposalStatus: string | null) => {
    if (proposalStatus === "SENT") {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">Proposal Sent</Badge>;
    }
    if (proposalStatus === "ACCEPTED") {
      return <Badge variant="outline" className="bg-green-100 text-green-700">Accepted</Badge>;
    }
    if (proposalStatus === "REJECTED") {
      return <Badge variant="outline" className="bg-red-100 text-red-700">Rejected</Badge>;
    }
    
    switch (status) {
      case "CONTRACTOR_REVIEWING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Action Required</Badge>;
      case "PROPOSAL_SENT":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Proposal Sent</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Accepted</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-700">Declined</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-600">{status}</Badge>;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDownIcon className="h-4 w-4 ml-1 text-muted-foreground" />;
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1 text-primary" />
    );
  };

  const filteredProjects = projects
    .filter(project => {
      // Search filter
      const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.material.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== "all") {
        const projectStatus = project.proposalStatus || project.status;
        if (statusFilter === "completed" && projectStatus !== "COMPLETED") return false;
        if (statusFilter === "rejected" && projectStatus !== "REJECTED" && project.proposalStatus !== "REJECTED") return false;
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
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMinCost("");
    setMaxCost("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Archived Projects</h2>
          <p className="text-muted-foreground">
            View your archived roofing projects
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading archived projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Archived Projects</h2>
        <p className="text-muted-foreground">
          View and manage your archived roofing projects
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
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
                placeholder="Search projects by name or material..."
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
            {hasActiveFilters && (
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
              <CardTitle>Archived Projects</CardTitle>
              <CardDescription>
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
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
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("projectName")}>
                    <div className="flex items-center">
                      Project Name
                      {getSortIcon("projectName")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("material")}>
                    <div className="flex items-center">
                      Material
                      {getSortIcon("material")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("area")}>
                    <div className="flex items-center">
                      Area
                      {getSortIcon("area")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("totalCost")}>
                    <div className="flex items-center">
                      Cost
                      {getSortIcon("totalCost")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("createdAt")}>
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
                ) : filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>{project.material}</TableCell>
                      <TableCell>{formatArea(project.area)}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(project.totalCost)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status, project.proposalStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handleViewProject(project)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUnarchive(project.id)}
                              className="text-blue-600"
                            >
                              <ArchiveIcon className="h-4 w-4 mr-2" />
                              Unarchive
                            </DropdownMenuItem>
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
                {searchQuery ? "No archived projects match your search." : "You don't have any archived projects yet."}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Project Details View Dialog */}
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

      {/* Unarchive Confirmation Dialog */}
      <Dialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unarchive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to unarchive this project? It will be restored to your active projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnarchiveDialogOpen(false);
                setProjectToUnarchive(null);
              }}
              disabled={unarchiving}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnarchive}
              disabled={unarchiving}
            >
              {unarchiving ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Unarchiving...
                </>
              ) : (
                "Unarchive"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

