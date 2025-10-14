"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileTextIcon,
  EyeIcon,
  CalendarIcon,
  MapPinIcon,
  EditIcon,
  ArchiveIcon,
  PrinterIcon,
  MoreVerticalIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SendIcon,
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

type SortField = "projectName" | "material" | "area" | "totalCost" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
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

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === "all" || project.status === statusFilter || 
                         (statusFilter === "proposal" && project.proposalStatus === "SENT");
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.address && project.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="CLIENT_PENDING">Pending Contractor</SelectItem>
              <SelectItem value="CONTRACTOR_REVIEWING">Under Review</SelectItem>
              <SelectItem value="proposal">Proposal Sent</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Table */}
      {sortedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || statusFilter !== "all"
                ? "No projects match your current filters."
                : "You haven't created any projects yet. Use the roof calculator to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
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
              {sortedProjects.map((project) => (
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
                  <TableCell>{getStatusBadge(project.status, project.proposalStatus)}</TableCell>
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVerticalIcon className="h-4 w-4" />
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
                        {project.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/projects/${project.id}/send-to-contractor`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                });
                                
                                if (!response.ok) throw new Error("Failed to send to contractor");
                                
                                toast.success("Project sent to contractor successfully");
                                fetchProjects();
                              } catch (error) {
                                console.error("Failed to send to contractor:", error);
                                toast.error("Failed to send project to contractor");
                              }
                            }}
                          >
                            <SendIcon className="mr-2 h-4 w-4" />
                            Send to Contractor
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            toast.info("Archive functionality coming soon");
                          }}
                        >
                          <ArchiveIcon className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
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
      )}

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
    </div>
  );
}
