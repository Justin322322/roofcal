"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  MapPinIcon, 
  DollarSignIcon, 
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from "lucide-react";
import type { Project } from "@/types/project";
import { ProposalBuilder } from "../proposals/proposal-builder";

interface AssignedProject extends Project {
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Global cache for assigned projects data to prevent re-fetching on tab switches
let globalAssignedProjectsCache: AssignedProject[] | null = null;
let globalAssignedProjectsLoading = false;
let globalAssignedProjectsHasFetched = false;

// Custom hook to manage assigned projects data with global caching
function useAssignedProjectsData() {
  const { data: session } = useSession();
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>(globalAssignedProjectsCache || []);
  const [loading, setLoading] = useState(globalAssignedProjectsLoading);
  const hasFetched = useRef(globalAssignedProjectsHasFetched);

  const fetchAssignedProjects = useCallback(async () => {
    if (globalAssignedProjectsLoading) return; // Prevent duplicate requests
    
    globalAssignedProjectsLoading = true;
    setLoading(true);
    
    try {
      const response = await fetch("/api/projects/assigned");
      
      if (response.ok) {
        const data = await response.json();
        const fetchedProjects = data.projects || [];
        setAssignedProjects(fetchedProjects);
        globalAssignedProjectsCache = fetchedProjects;
      } else {
        const errorData = await response.json();
        toast.error("Failed to fetch assigned projects", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to fetch assigned projects", {
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
      globalAssignedProjectsLoading = false;
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && session.user.role === "ADMIN") {
      if (!hasFetched.current) {
        hasFetched.current = true;
        globalAssignedProjectsHasFetched = true;
        fetchAssignedProjects();
      } else if (globalAssignedProjectsCache) {
        // Use cached data if available
        setAssignedProjects(globalAssignedProjectsCache);
        setLoading(false);
      }
    } else if (session === null) {
      // Reset cache on logout
      globalAssignedProjectsCache = null;
      globalAssignedProjectsHasFetched = false;
      hasFetched.current = false;
      setAssignedProjects([]);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session, fetchAssignedProjects]);

  return { assignedProjects, loading, fetchAssignedProjects };
}

export function AssignedProjectsContent() {
  const { data: session } = useSession();
  const { assignedProjects, fetchAssignedProjects } = useAssignedProjectsData();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null);
  const [showProposalBuilder, setShowProposalBuilder] = useState(false);

  const handleStatusUpdate = async (projectId: string, newStatus: Project["status"]) => {
    setActionLoading(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh data to get updated state
        await fetchAssignedProjects();
        toast.success("Project status updated successfully");
      } else {
        const errorData = await response.json();
        toast.error("Failed to update project status", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to update project status", {
        description: "Network error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "CLIENT_PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONTRACTOR_REVIEWING":
        return "bg-blue-100 text-blue-800";
      case "PROPOSAL_SENT":
        return "bg-purple-100 text-purple-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-indigo-100 text-indigo-800";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "CLIENT_PENDING":
        return <ClockIcon className="h-4 w-4" />;
      case "CONTRACTOR_REVIEWING":
        return <AlertCircleIcon className="h-4 w-4" />;
      case "PROPOSAL_SENT":
        return <AlertCircleIcon className="h-4 w-4" />;
      case "ACCEPTED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <ClockIcon className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "REJECTED":
        return <AlertCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const { pendingProjects, activeProjects, completedProjects } = useMemo(() => ({
    pendingProjects: assignedProjects.filter(p => 
      ["CLIENT_PENDING", "CONTRACTOR_REVIEWING"].includes(p.status)
    ),
    activeProjects: assignedProjects.filter(p => 
      ["PROPOSAL_SENT", "ACCEPTED", "IN_PROGRESS"].includes(p.status)
    ),
    completedProjects: assignedProjects.filter(p => 
      ["COMPLETED", "REJECTED"].includes(p.status)
    ),
  }), [assignedProjects]);

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="px-4 lg:px-6">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This page is only accessible to contractors. You need administrator privileges to view assigned projects.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Manage projects assigned to you by homeowners and track their progress
        </p>
      </div>

      {assignedProjects.length === 0 ? (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            No projects have been assigned to you yet. Homeowners can request quotes from you through their projects.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingProjects.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onStatusUpdate={handleStatusUpdate}
                  actionLoading={actionLoading}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onStatusUpdate={handleStatusUpdate}
                  actionLoading={actionLoading}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onStatusUpdate={handleStatusUpdate}
                  actionLoading={actionLoading}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Proposal Builder Modal */}
      {showProposalBuilder && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Proposal</CardTitle>
              <CardDescription>
                Send a proposal for {selectedProject.projectName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProposalBuilder
                project={selectedProject}
                onProposalSent={() => {
                  fetchAssignedProjects();
                  setShowProposalBuilder(false);
                  setSelectedProject(null);
                }}
                onClose={() => {
                  setShowProposalBuilder(false);
                  setSelectedProject(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: AssignedProject;
  onStatusUpdate: (projectId: string, status: Project["status"]) => void;
  actionLoading: string | null;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  getStatusColor: (status: Project["status"]) => string;
  getStatusIcon: (status: Project["status"]) => React.ReactNode;
}

function ProjectCard({
  project,
  onStatusUpdate,
  actionLoading,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
}: ProjectCardProps) {
  const getAvailableActions = (status: Project["status"]) => {
    switch (status) {
      case "CLIENT_PENDING":
        return [
          { label: "Start Review", status: "CONTRACTOR_REVIEWING" as const },
        ];
      case "CONTRACTOR_REVIEWING":
        return [
          { label: "Send Proposal", status: "PROPOSAL_SENT" as const, isProposal: true },
        ];
      case "PROPOSAL_SENT":
        return [
          { label: "Mark Accepted", status: "ACCEPTED" as const },
          { label: "Mark Rejected", status: "REJECTED" as const },
        ];
      case "ACCEPTED":
        return [
          { label: "Start Work", status: "IN_PROGRESS" as const },
        ];
      case "IN_PROGRESS":
        return [
          { label: "Mark Complete", status: "COMPLETED" as const },
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions(project.status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.projectName}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {project.client.firstName} {project.client.lastName}
              </div>
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(project.status)} flex items-center gap-1`}>
            {getStatusIcon(project.status)}
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatCurrency(project.totalCost)}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(project.assignedAt || project.created_at)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <span>{project.roofType} roof, {project.length}m × {project.width}m</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Material:</span>
            <span>{project.material}</span>
          </div>
        </div>

        {availableActions.length > 0 && (
          <div className="flex gap-2 pt-2">
            {availableActions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant="outline"
                onClick={() => {
                  if ('isProposal' in action && action.isProposal) {
                    // Handle proposal creation
                    onStatusUpdate(project.id, action.status);
                  } else {
                    onStatusUpdate(project.id, action.status);
                  }
                }}
                disabled={actionLoading === project.id}
              >
                {actionLoading === project.id ? "Updating..." : action.label}
              </Button>
            ))}
          </div>
        )}

        {project.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notes:</span> {project.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
