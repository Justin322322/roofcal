"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2Icon,
  FileTextIcon,
  EyeIcon,
  FilterIcon,
  MoreHorizontal,
  Archive,
} from "lucide-react";
import { getStatusBadge } from "@/lib/badge-utils";

interface Project {
  id: string;
  projectName: string;
  status: string;
  proposalStatus: string | null;
  totalCost: number;
  area: number;
  material: string;
  createdAt: Date;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function AdminRecordManagementContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/contractor/projects");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.projects) {
          setProjects(result.projects);
        }
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
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
        description: "The project has been archived.",
      });

      // Optimistically update local state
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: "ARCHIVED" } : p));
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

  const effectiveStatus = (project: Project) => project.proposalStatus || project.status;

  const filteredProjects = projects.filter(project => {
    // Exclude archived projects from admin record management view
    if (project.status === "ARCHIVED") return false;
    
    // Only include Completed or Rejected items
    const status = effectiveStatus(project);
    if (status !== "COMPLETED" && status !== "REJECTED") return false;

    // Apply selected filter
    if (statusFilter !== "all") {
      if (statusFilter === "completed" && status !== "COMPLETED") return false;
      if (statusFilter === "rejected" && status !== "REJECTED") return false;
    }

    // Search
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client && (
        project.client.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    if (!matchesSearch) return false;

    // Cost
    if (minCost && project.totalCost < parseFloat(minCost)) return false;
    if (maxCost && project.totalCost > parseFloat(maxCost)) return false;

    // Date
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileTextIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Record Management</h1>
            <p className="text-sm text-muted-foreground">Manage Completed and Rejected records</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FilterIcon className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input id="search" placeholder="Search by project, material, or client" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minCost">Min Cost</Label>
                <Input id="minCost" type="number" placeholder="₱0" value={minCost} onChange={(e) => setMinCost(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCost">Max Cost</Label>
                <Input id="maxCost" type="number" placeholder="₱0" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Records ({filteredProjects.length})</CardTitle>
            <CardDescription>Completed and Rejected projects are shown</CardDescription>
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
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.projectName}</div>
                            <div className="text-sm text-muted-foreground">{project.material} • {project.area} sqm</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.client ? (
                            <div>
                              <div className="font-medium">{project.client.firstName} {project.client.lastName}</div>
                              <div className="text-sm text-muted-foreground">{project.client.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No client info</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status, project.proposalStatus ?? undefined)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(project.totalCost)}</TableCell>
                        <TableCell>{formatDate(project.createdAt)}</TableCell>
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
                              {(effectiveStatus(project) === "COMPLETED" || effectiveStatus(project) === "REJECTED") && (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && filteredProjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo
                  ? "No records match your current filters."
                  : "No Completed or Rejected records found."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog (reusing ProjectDetailsViewer would require import from roof-calculator; keeping light) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>{selectedProject?.projectName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {selectedProject && (
              <>
                <div><span className="text-muted-foreground">Material:</span> {selectedProject.material}</div>
                <div><span className="text-muted-foreground">Status:</span> {effectiveStatus(selectedProject)}</div>
                <div><span className="text-muted-foreground">Cost:</span> {formatCurrency(selectedProject.totalCost)}</div>
                <div><span className="text-muted-foreground">Date:</span> {formatDate(selectedProject.createdAt)}</div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this project? Archived projects can be viewed later under Archive Records.
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
                if (projectToArchive) handleArchiveProject(projectToArchive);
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


