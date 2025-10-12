"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  UsersIcon,
  UserIcon,
  MailIcon,
  DollarSignIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  BarChart3Icon
} from "lucide-react";
import type { Project } from "@/types/project";
import { ProjectStatusManager } from "@/components/project-status-manager";
import { getStatusDisplayInfo } from "@/lib/project-workflow";

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

export function ClientManagementPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  useEffect(() => {
    // Only fetch data if user is authenticated and is an admin
    if (session?.user?.id && session.user.role === "ADMIN") {
      fetchClientData();
    } else if (session === null) {
      // If session is explicitly null (logged out), stop loading
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch all assigned projects to get client data
      const response = await fetch("/api/projects/assigned");
      
      if (response.ok) {
        const data = await response.json();
        const projects: Project[] = data.projects || [];
        
        // Group projects by client
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
        setClients(clientList);
        
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
        setProjectSummary(summary);
        
      } else {
        const errorData = await response.json();
        toast.error("Failed to fetch client data", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to fetch client data", {
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (projectId: string, newStatus: Project["status"]) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchClientData(); // Refresh data
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
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusInfo = getStatusDisplayInfo(status as Project["status"]);
    return statusInfo.color;
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="px-4 lg:px-6">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This page is only accessible to contractors. You need administrator privileges to manage clients.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your clients and track project progress across all assignments.
        </p>
      </div>

      {/* Summary Cards */}
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

      {/* Clients List */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Client Overview</TabsTrigger>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                  {projectSummary && Object.entries(projectSummary.byStatus).map(([status, count]) => {
                    const percentage = (count / projectSummary.total) * 100;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={getStatusColor(status)}>
                            {getStatusDisplayInfo(status as Project["status"]).label}
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
