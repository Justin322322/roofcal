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
  MapPinIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  PlayIcon,
  CheckCircleIcon,
  FilterIcon,
  XCircleIcon,
  MessageSquareIcon,
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
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export function ContractorProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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

  const handleAcceptAndSendProposal = async (projectId: string) => {
    try {
      // First approve the project
      const approveResponse = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!approveResponse.ok) throw new Error("Failed to approve project");

      toast.success("Project approved and ready for proposal");
      fetchProjects();
    } catch (error) {
      console.error("Failed to accept project:", error);
      toast.error("Failed to accept project");
    }
  };

  const handleRequestMoreInfo = async () => {
    toast.info("Request more info functionality coming soon");
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
    // Search filter
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== "all") {
      const projectStatus = project.proposalStatus || project.status;
      if (statusFilter === "pending" && projectStatus !== "CLIENT_PENDING") return false;
      if (statusFilter === "reviewing" && projectStatus !== "CONTRACTOR_REVIEWING") return false;
      if (statusFilter === "proposal" && projectStatus !== "PROPOSAL_SENT" && project.proposalStatus !== "SENT") return false;
      if (statusFilter === "accepted" && projectStatus !== "ACCEPTED" && project.proposalStatus !== "ACCEPTED") return false;
      if (statusFilter === "in_progress" && projectStatus !== "IN_PROGRESS") return false;
      if (statusFilter === "completed" && projectStatus !== "COMPLETED") return false;
      if (statusFilter === "rejected" && project.proposalStatus !== "REJECTED") return false;
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
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
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
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo;

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
                placeholder="Search projects by name or client..."
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
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="reviewing">Under Review</SelectItem>
                    <SelectItem value="proposal">Proposal Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
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
              <CardTitle>Projects</CardTitle>
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
                        {project.client ? `${project.client.firstName} ${project.client.lastName}` : 'N/A'}
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
                        <span className="font-medium">
                          {project.totalCost.toLocaleString()}
                        </span>
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
                          {project.status === "CONTRACTOR_REVIEWING" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAcceptAndSendProposal(project.id)}
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Accept & Send Proposal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRequestMoreInfo}
                              >
                                <MessageSquareIcon className="h-4 w-4 mr-1" />
                                Request Info
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
                          {(project.status === "PROPOSAL_SENT" || 
                            project.status === "COMPLETED" ||
                            (project.proposalStatus === "SENT" || project.proposalStatus === "ACCEPTED" || project.proposalStatus === "REJECTED")) && (
                            <span className="text-sm text-muted-foreground">No actions available</span>
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
