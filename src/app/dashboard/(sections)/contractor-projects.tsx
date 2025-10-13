"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2Icon,
  FileTextIcon,
  EyeIcon,
  SendIcon,
  UserIcon,
  MapPinIcon,
  DollarSignIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import { ProposalBuilder } from "./contractor-projects/proposal-builder";

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
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Original estimates
  materialCost: number;
  laborCost: number;
  deliveryCost: number | null;
  length: number;
  width: number;
  pitch: number;
  roofType: string;
  floors: number;
  notes: string | null;
}

interface KanbanColumn {
  id: string;
  title: string;
  statuses: string[];
  color: string;
  projects: Project[];
}

export function ContractorProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);

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

  // Intentionally removed unused handleStatusUpdate to satisfy linter

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
      case "CLIENT_PENDING":
        return <Badge variant="outline" className="border-orange-200 text-orange-800">Pending Review</Badge>;
      case "CONTRACTOR_REVIEWING":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case "PROPOSAL_SENT":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Proposal Sent</Badge>;
      case "ACCEPTED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: KanbanColumn[] = [
    {
      id: "pending",
      title: "Pending Review",
      statuses: ["CLIENT_PENDING"],
      color: "border-orange-200",
      projects: projects.filter(p => p.status === "CLIENT_PENDING" && !searchQuery || 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase())),
    },
    {
      id: "reviewing",
      title: "Under Review",
      statuses: ["CONTRACTOR_REVIEWING"],
      color: "border-yellow-200",
      projects: projects.filter(p => p.status === "CONTRACTOR_REVIEWING" && !searchQuery || 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase())),
    },
    {
      id: "proposal",
      title: "Proposal Sent",
      statuses: ["PROPOSAL_SENT"],
      color: "border-blue-200",
      projects: projects.filter(p => p.status === "PROPOSAL_SENT" && !searchQuery || 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase())),
    },
    {
      id: "accepted",
      title: "Accepted",
      statuses: ["ACCEPTED"],
      color: "border-green-200",
      projects: projects.filter(p => p.status === "ACCEPTED" && !searchQuery || 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase())),
    },
    {
      id: "progress",
      title: "In Progress",
      statuses: ["IN_PROGRESS"],
      color: "border-purple-200",
      projects: projects.filter(p => p.status === "IN_PROGRESS" && !searchQuery || 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase())),
    },
    {
      id: "completed",
      title: "Completed",
      statuses: ["COMPLETED"],
      color: "border-gray-200",
      projects: projects.filter(p => p.status === "COMPLETED" && !searchQuery || 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase())),
    },
  ];

  const canCreateProposal = (project: Project) => 
    project.status === "CONTRACTOR_REVIEWING" && !project.proposalStatus;

  const canViewProject = (project: Project) => {
    void project; // mark parameter as intentionally unused
    return true;
  };

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">
            Manage client projects and create custom proposals
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <p className="text-muted-foreground">
          Manage client projects and create custom proposals
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "CLIENT_PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Sent</CardTitle>
            <SendIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.proposalStatus === "SENT").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle>Project Pipeline</CardTitle>
          <CardDescription>
            Track projects through different stages of the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {columns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">{column.projects.length}</Badge>
                </div>
                <div className={`space-y-3 min-h-[300px] border-2 border-dashed ${column.color} rounded-lg p-4`}>
                  {column.projects.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <AlertCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No projects</p>
                      </div>
                    </div>
                  ) : (
                    column.projects.map((project) => (
                      <Card key={project.id} className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm leading-tight">{project.projectName}</CardTitle>
                            <div className="flex-shrink-0">
                              {getStatusBadge(project.status, project.proposalStatus)}
                            </div>
                          </div>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <UserIcon className="h-3 w-3" />
                            <span className="truncate">{project.client.firstName} {project.client.lastName}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate text-muted-foreground">
                                {project.address ? (
                                  `${project.address}, ${project.city}`
                                ) : (
                                  "No address"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSignIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">₱{project.totalCost.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {canCreateProposal(project) && (
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1 text-xs h-7"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setProposalDialogOpen(true);
                                }}
                              >
                                <SendIcon className="h-3 w-3 mr-1" />
                                Create Proposal
                              </Button>
                            )}
                            
                            {canViewProject(project) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-7"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proposal Builder Dialog */}
      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Proposal</DialogTitle>
            <DialogDescription>
              Create a custom proposal for the client&#39;s project.
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <ProposalBuilder
              project={selectedProject}
              onProposalSent={() => {
                setProposalDialogOpen(false);
                fetchProjects();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
