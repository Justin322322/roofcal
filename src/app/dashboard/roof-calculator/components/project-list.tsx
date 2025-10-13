"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  SendIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  DollarSignIcon,
  MapPinIcon,
} from "lucide-react";
import { loadProject } from "../actions";
import { ProposalViewer } from "./proposal-viewer";

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

interface ProjectListProps {
  onProjectLoaded?: (data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    measurements: any;
    material: string;
    projectId?: string;
  }) => void;
}

export function ProjectList({ onProjectLoaded }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.projects) {
          // Convert Decimal fields to numbers for display
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedProjects = result.projects.map((p: any) => ({
            ...p,
            totalCost: Number(p.totalCost),
            created_at: new Date(p.created_at as string),
          }));
          setProjects(formattedProjects);
        }
      }
    } catch {
      console.error("Failed to fetch projects");
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      const result = await loadProject(projectId);
      if (result.success && result.data && onProjectLoaded) {
        onProjectLoaded(result.data);
        toast.success("Project loaded successfully");
      } else {
        toast.error("Failed to load project", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to load project", {
        description: "An unexpected error occurred",
      });
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

  const canRequestQuote = (project: Project) => project.status === "DRAFT";
  const canViewProposal = (project: Project) => project.proposalStatus === "SENT";
  const canLoadProject = (project: Project) => project.status !== "COMPLETED";

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

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.projectName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPinIcon className="h-3 w-3" />
                      {project.address ? (
                        <span className="truncate">
                          {project.address}, {project.city}, {project.state}
                        </span>
                      ) : (
                        <span>No address</span>
                      )}
                    </CardDescription>
                  </div>
                  {getStatusBadge(project.status, project.proposalStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Material</div>
                    <div className="capitalize">{project.material}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Area</div>
                    <div>{project.area.toFixed(1)} m²</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Est. Cost</div>
                    <div className="flex items-center gap-1">
                      <DollarSignIcon className="h-3 w-3" />
                      ₱{project.totalCost.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Created</div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {project.contractor && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Contractor:</span>
                    <span>{project.contractor.firstName} {project.contractor.lastName}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {canLoadProject(project) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadProject(project.id)}
                      className="flex-1"
                    >
                      <FileTextIcon className="h-3 w-3 mr-1" />
                      Load
                    </Button>
                  )}
                  
                  {canRequestQuote(project) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <SendIcon className="h-3 w-3 mr-1" />
                      Request Quote
                    </Button>
                  )}
                  
                  {canViewProposal(project) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project);
                        setProposalDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View Proposal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
}
