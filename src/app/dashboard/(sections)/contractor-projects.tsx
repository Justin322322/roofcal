"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Loader2Icon,
  FileTextIcon,
  MapPinIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  PlayIcon,
  CheckCircleIcon,
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
  createdAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function ContractorProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleApproveProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to approve project");

      toast.success("Project approved successfully");
      fetchProjects();
    } catch (error) {
      console.error("Failed to approve project:", error);
      toast.error("Failed to approve project");
    }
  };

  const handleDeclineProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to decline project");

      toast.success("Project declined");
      fetchProjects();
    } catch (error) {
      console.error("Failed to decline project:", error);
      toast.error("Failed to decline project");
    }
  };

  const handleStartContract = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/start-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to start contract");

      toast.success("Contract started");
      fetchProjects();
    } catch (error) {
      console.error("Failed to start contract:", error);
      toast.error("Failed to start contract");
    }
  };

  const handleFinishProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to finish project");

      toast.success("Project completed");
      fetchProjects();
    } catch (error) {
      console.error("Failed to finish project:", error);
      toast.error("Failed to finish project");
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Contractor Projects</h2>
          <p className="text-muted-foreground">
            Manage and track your assigned projects
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
        <h2 className="text-2xl font-bold">Contractor Projects</h2>
        <p className="text-muted-foreground">
          Manage and track your assigned projects
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search projects by name or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-96"
        />
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No projects match your search." : "You don't have any assigned projects yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>
                        {project.client.firstName} {project.client.lastName}
                      </TableCell>
                      <TableCell>
                        {project.address ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPinIcon className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {project.city}, {project.state}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">₱{project.totalCost.toFixed(0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status, project.proposalStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {project.status === "CLIENT_PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveProject(project.id)}
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeclineProject(project.id)}
                              >
                                <XIcon className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {project.status === "ACCEPTED" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStartContract(project.id)}
                            >
                              <PlayIcon className="h-4 w-4 mr-1" />
                              Start Contract
                            </Button>
                          )}
                          {project.status === "IN_PROGRESS" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleFinishProject(project.id)}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Finish
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
  );
}
