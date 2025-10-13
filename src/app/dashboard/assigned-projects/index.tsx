"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarIcon, 
  MapPinIcon, 
  DollarSignIcon, 
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UsersIcon,
  TrendingUpIcon,
  FileTextIcon,
  BarChart3Icon,
  MailIcon
} from "lucide-react";
import type { Project } from "@/types/project";
import { ProposalBuilder } from "../proposals/proposal-builder";
import { ProjectStatusManager } from "@/components/project-status-manager";
import { getStatusDisplayInfo } from "@/lib/project-workflow";

interface AssignedProject extends Project {
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  projects: Project[];
  totalValue: number;
  completedProjects: number;
  activeProjects: number;
  pendingProjects: number;
}

interface ProjectSummary {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  averageValue: number;
}

// Global cache for assigned projects data to prevent re-fetching on tab switches
let globalAssignedProjectsCache: {
  projects: AssignedProject[];
  clients: ClientData[];
  projectSummary: ProjectSummary | null;
} | null = null;
let globalAssignedProjectsLoading = false;
let globalAssignedProjectsHasFetched = false;

// Custom hook to manage assigned projects data with global caching
function useAssignedProjectsData() {
  const { data: session } = useSession();
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>(globalAssignedProjectsCache?.projects || []);
  const [clients, setClients] = useState<ClientData[]>(globalAssignedProjectsCache?.clients || []);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(globalAssignedProjectsCache?.projectSummary || null);
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
        const projects: Project[] = data.projects || [];
        
        // Group projects by client for client management
        const clientMap = new Map<string, ClientData>();
        
        projects.forEach((project) => {
          if (project.clientId) {
            const clientId = project.clientId;
            
            if (!clientMap.has(clientId)) {
              clientMap.set(clientId, {
                id: clientId,
                firstName: "Client", // We don't have client details in this API
                lastName: `#${clientId.slice(-4)}`,
                email: `client-${clientId.slice(-4)}@example.com`,
                projects: [],
                totalValue: 0,
                completedProjects: 0,
                activeProjects: 0,
                pendingProjects: 0,
              });
            }
            
            const client = clientMap.get(clientId)!;
            client.projects.push(project);
            client.totalValue += project.totalCost;
            
            // Count projects by status
            switch (project.status) {
              case "COMPLETED":
                client.completedProjects++;
                break;
              case "IN_PROGRESS":
              case "ACCEPTED":
                client.activeProjects++;
                break;
              case "CLIENT_PENDING":
              case "CONTRACTOR_REVIEWING":
              case "PROPOSAL_SENT":
                client.pendingProjects++;
                break;
            }
          }
        });
        
        const clientList = Array.from(clientMap.values());
        
        // Calculate project summary
        const summary: ProjectSummary = {
          total: projects.length,
          byStatus: {},
          totalValue: projects.reduce((sum, p) => sum + p.totalCost, 0),
          averageValue: 0,
        };
        
        projects.forEach((project) => {
          summary.byStatus[project.status] = (summary.byStatus[project.status] || 0) + 1;
        });
        
        summary.averageValue = summary.total > 0 ? summary.totalValue / summary.total : 0;
        
        // Update state
        setAssignedProjects(projects as AssignedProject[]);
        setClients(clientList);
        setProjectSummary(summary);
        
        // Update global cache
        globalAssignedProjectsCache = {
          projects: projects as AssignedProject[],
          clients: clientList,
          projectSummary: summary,
        };
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
        setAssignedProjects(globalAssignedProjectsCache.projects);
        setClients(globalAssignedProjectsCache.clients);
        setProjectSummary(globalAssignedProjectsCache.projectSummary);
        setLoading(false);
      }
    } else if (session === null) {
      // Reset cache on logout
      globalAssignedProjectsCache = null;
      globalAssignedProjectsHasFetched = false;
      hasFetched.current = false;
      setAssignedProjects([]);
      setClients([]);
      setProjectSummary(null);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session, fetchAssignedProjects]);

  return { assignedProjects, clients, projectSummary, loading, fetchAssignedProjects };
}

export function AssignedProjectsContent() {
  const { data: session } = useSession();
  const { assignedProjects, clients, projectSummary, fetchAssignedProjects } = useAssignedProjectsData();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null);
  const [showProposalBuilder, setShowProposalBuilder] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

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

  const getStatusColor = (status: string) => {
    const statusInfo = getStatusDisplayInfo(status as Project["status"]);
    return statusInfo.color;
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

      {/* Summary Stats Cards */}
      {projectSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectSummary.total}</div>
              <p className="text-xs text-muted-foreground">
                Across {clients.length} clients
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(projectSummary.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(projectSummary.averageValue)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(projectSummary.byStatus["IN_PROGRESS"] || 0) + (projectSummary.byStatus["ACCEPTED"] || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                In progress or accepted
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectSummary.byStatus["COMPLETED"] || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {assignedProjects.length === 0 ? (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            No projects have been assigned to you yet. Homeowners can request quotes from you through their projects.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">
              My Tasks ({pendingProjects.length + activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="clients">
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="projects">
              All Projects ({assignedProjects.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* My Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Tabs defaultValue="pending" className="space-y-4">
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
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onViewDetails={() => {
                    setSelectedClient(client);
                    setShowClientDetails(true);
                  }}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </TabsContent>

          {/* All Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="space-y-4">
              {clients.map((client) => (
                <Card key={client.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      {client.firstName} {client.lastName}
                    </CardTitle>
                    <CardDescription>{client.projects.length} projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {client.projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium">{project.projectName}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatCurrency(project.totalCost)}</span>
                              <span>{project.area.toFixed(1)} m²</span>
                              <span>{project.material}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusDisplayInfo(project.status).label}
                            </Badge>
                            <ProjectStatusManager
                              project={project}
                              onStatusUpdate={(newStatus) => handleStatusUpdate(project.id, newStatus)}
                              compact
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5" />
                    Project Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectSummary && Object.entries(projectSummary.byStatus).map(([statusKey, count]) => {
                      const percentage = (count / projectSummary.total) * 100;
                      const status = statusKey as Project["status"];
                      return (
                        <div key={statusKey} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={getStatusColor(status)}>
                              {getStatusDisplayInfo(status).label}
                            </span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Client Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clients.map((client) => {
                      const completionRate = client.projects.length > 0 
                        ? (client.completedProjects / client.projects.length) * 100 
                        : 0;
                      
                      return (
                        <div key={client.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{client.firstName} {client.lastName}</span>
                            <span>{completionRate.toFixed(0)}% completion</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {client.completedProjects}/{client.projects.length} completed • {formatCurrency(client.totalValue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
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

      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {selectedClient.firstName} {selectedClient.lastName}
              </CardTitle>
              <CardDescription>Client Details & Project History</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientDetailsContent
                client={selectedClient}
                onClose={() => {
                  setShowClientDetails(false);
                  setSelectedClient(null);
                }}
                formatCurrency={formatCurrency}
                onStatusUpdate={handleStatusUpdate}
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

interface ClientCardProps {
  client: ClientData;
  onViewDetails: () => void;
  formatCurrency: (amount: number) => string;
}

function ClientCard({ client, onViewDetails, formatCurrency }: ClientCardProps) {
  const completionRate = client.projects.length > 0 
    ? (client.completedProjects / client.projects.length) * 100 
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          {client.firstName} {client.lastName}
        </CardTitle>
        <CardDescription>{client.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Projects:</span>
            <span className="ml-2 font-medium">{client.projects.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Value:</span>
            <span className="ml-2 font-medium">{formatCurrency(client.totalValue)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span>{completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        <div className="flex gap-2">
          <Badge variant="outline">{client.activeProjects} Active</Badge>
          <Badge variant="outline">{client.completedProjects} Completed</Badge>
          <Badge variant="outline">{client.pendingProjects} Pending</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface ClientDetailsContentProps {
  client: ClientData;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  onStatusUpdate: (projectId: string, status: Project["status"]) => Promise<void>;
}

function ClientDetailsContent({ 
  client, 
  onClose, 
  formatCurrency, 
  onStatusUpdate 
}: ClientDetailsContentProps) {
  return (
    <div className="space-y-6">
      {/* Client Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Contact Information</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MailIcon className="h-4 w-4" />
              {client.email}
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Project Summary</h4>
          <div className="space-y-1 text-sm">
            <div>Total Projects: <span className="font-medium">{client.projects.length}</span></div>
            <div>Total Value: <span className="font-medium">{formatCurrency(client.totalValue)}</span></div>
            <div>Completed: <span className="font-medium">{client.completedProjects}</span></div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <h4 className="font-medium mb-3">Project History</h4>
        <div className="space-y-3">
          {client.projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h5 className="font-medium">{project.projectName}</h5>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatCurrency(project.totalCost)}</span>
                    <span>{project.area.toFixed(1)} m²</span>
                    <span>{project.material}</span>
                  </div>
                </div>
                <ProjectStatusManager
                  project={project}
                  onStatusUpdate={(newStatus) => onStatusUpdate(project.id, newStatus)}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
