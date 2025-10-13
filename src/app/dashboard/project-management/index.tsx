"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { 
  DollarSignIcon, 
  UserIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UsersIcon,
  TrendingUpIcon,
  FileTextIcon,
  BarChart3Icon,
  SearchIcon,
  RefreshCwIcon,
  DownloadIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { Project } from "@/types/project";
import { ProposalBuilder } from "../proposals/proposal-builder";
import { ProposalViewer } from "../proposals/proposal-viewer";
import { getStatusDisplayInfo } from "@/lib/project-workflow";
import { KanbanBoardComponent } from "@/components/kanban/kanban-board";
import { useKanban } from "@/hooks/use-kanban";
import { ProjectCard, ClientCard, ClientDetailsContent } from "./components";

interface AssignedProject extends Project {
  client?: {
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

// Global cache for project management data
let globalProjectManagementCache: {
  projects: AssignedProject[];
  clients: ClientData[];
  projectSummary: ProjectSummary | null;
} | null = null;
let globalProjectManagementLoading = false;
let globalProjectManagementHasFetched = false;

// Custom hook to manage project management data with global caching
function useProjectManagementData() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<AssignedProject[]>(globalProjectManagementCache?.projects || []);
  const [clients, setClients] = useState<ClientData[]>(globalProjectManagementCache?.clients || []);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(globalProjectManagementCache?.projectSummary || null);
  const [loading, setLoading] = useState(globalProjectManagementLoading);
  const hasFetched = useRef(globalProjectManagementHasFetched);

  const fetchProjects = useCallback(async () => {
    if (globalProjectManagementLoading) return;
    
    globalProjectManagementLoading = true;
    setLoading(true);
    
    try {
      const response = await fetch("/api/projects/assigned");
      
      if (response.ok) {
        const data = await response.json();
        const fetchedProjects: AssignedProject[] = data.projects || [];
        
        // Group projects by client
        const clientMap = new Map<string, ClientData>();
        
        fetchedProjects.forEach((project) => {
          if (project.clientId) {
            const clientId = project.clientId;
            
            if (!clientMap.has(clientId)) {
              const clientData = project.client || {
                firstName: "Unknown",
                lastName: "Client",
                email: `client-${clientId.slice(-4)}@example.com`
              };
              
              clientMap.set(clientId, {
                id: clientId,
                firstName: clientData.firstName,
                lastName: clientData.lastName,
                email: clientData.email,
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
          total: fetchedProjects.length,
          byStatus: {},
          totalValue: fetchedProjects.reduce((sum, p) => sum + p.totalCost, 0),
          averageValue: 0,
        };
        
        fetchedProjects.forEach((project) => {
          summary.byStatus[project.status] = (summary.byStatus[project.status] || 0) + 1;
        });
        
        summary.averageValue = summary.total > 0 ? summary.totalValue / summary.total : 0;
        
        // Update state
        setProjects(fetchedProjects);
        setClients(clientList);
        setProjectSummary(summary);
        
        // Update global cache
        globalProjectManagementCache = {
          projects: fetchedProjects,
          clients: clientList,
          projectSummary: summary,
        };
      } else {
        const errorData = await response.json();
        toast.error("Failed to fetch projects", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to fetch projects", {
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
      globalProjectManagementLoading = false;
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && session.user.role === "ADMIN") {
      if (!hasFetched.current) {
        hasFetched.current = true;
        globalProjectManagementHasFetched = true;
        fetchProjects();
      } else if (globalProjectManagementCache) {
        setProjects(globalProjectManagementCache.projects);
        setClients(globalProjectManagementCache.clients);
        setProjectSummary(globalProjectManagementCache.projectSummary);
        setLoading(false);
      }
    } else if (session === null) {
      // Reset cache on logout
      globalProjectManagementCache = null;
      globalProjectManagementHasFetched = false;
      hasFetched.current = false;
      setProjects([]);
      setClients([]);
      setProjectSummary(null);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session, fetchProjects]);

  return { projects, clients, projectSummary, loading, fetchProjects };
}

export function ProjectManagementPage() {
  const { data: session } = useSession();
  const { projects, clients, projectSummary, loading, fetchProjects } = useProjectManagementData();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null);
  const [showProposalBuilder, setShowProposalBuilder] = useState(false);
  const [showProposalViewer, setShowProposalViewer] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Kanban setup
  const projectColumns = [
    "DRAFT",
    "CLIENT_PENDING",
    "CONTRACTOR_REVIEWING",
    "PROPOSAL_SENT",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "REJECTED",
  ] as const;

  const kanbanItems = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        title: p.projectName,
        status: p.status as string,
        position: (p as unknown as { boardPosition?: number }).boardPosition ?? 0,
        meta: (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{p.material}</span>
              <span>{(p.area as number).toFixed(1)} m²</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.roofType}</span>
              <span className="font-semibold text-primary">
                {new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(p.totalCost)}
              </span>
            </div>
            {p.client && (
              <div className="text-xs text-muted-foreground">
                Client: {p.client.firstName} {p.client.lastName}
              </div>
            )}
          </div>
        ),
      })),
    [projects]
  );

  const { itemsByColumn, moveItem } = useKanban(kanbanItems, {
    columns: (projectColumns as unknown as string[]),
    onReorder: async (items) => {
      await fetch("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      await fetchProjects();
    },
    canMove: (item, toStatus) => {
      const from = item.status;
      const forward: Record<string, string[]> = {
        DRAFT: ["CLIENT_PENDING"],
        CLIENT_PENDING: ["CONTRACTOR_REVIEWING"],
        CONTRACTOR_REVIEWING: ["PROPOSAL_SENT"],
        PROPOSAL_SENT: [], // accept/reject happens by client
        ACCEPTED: ["IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"],
        COMPLETED: [],
        REJECTED: [],
      };
      if (toStatus === from) return true; // reorder within column
      return forward[from]?.includes(toStatus) ?? false;
    },
  });

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
        await fetchProjects();
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

  // Filter data based on search and status
  const filteredData = projects.filter((project) => {
    const matchesSearch = !searchTerm ||
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.client && `${project.client.firstName} ${project.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      project.material.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter clients based on search
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true;
    return `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const { pendingProjects, activeProjects, draftProjects } = useMemo(() => ({
    draftProjects: projects.filter(p => p.status === "DRAFT"),
    pendingProjects: projects.filter(p => 
      ["CLIENT_PENDING", "CONTRACTOR_REVIEWING"].includes(p.status)
    ),
    activeProjects: projects.filter(p => 
      ["PROPOSAL_SENT", "ACCEPTED", "IN_PROGRESS"].includes(p.status)
    ),
  }), [projects]);

  const exportToCSV = async () => {
    try {
      const csvContent = [
        ['Project Name', 'Client', 'Status', 'Proposal Status', 'Total Cost', 'Area (m²)', 'Material', 'Date Assigned'],
        ...projects.map((project) => [
          project.projectName,
          project.client ? `${project.client.firstName} ${project.client.lastName}` : 'Unknown',
          project.status,
          project.proposalStatus || 'N/A',
          formatCurrency(project.totalCost),
          project.area.toFixed(1),
          project.material,
          formatDate(project.assignedAt || project.created_at),
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `project-management-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export completed', {
        description: 'Project data exported successfully',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: 'Failed to export project data',
      });
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="px-4 lg:px-6">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This page is only accessible to contractors. You need administrator privileges to view project management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="mb-4 flex justify-end">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="mb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-20 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
        <p className="text-muted-foreground">
          Manage all your assigned projects and client relationships
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProjects} disabled={loading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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

      {projects.length === 0 ? (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            No projects have been assigned to you yet. Homeowners can request quotes from you through their projects.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clients">
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="status-board">
              Status Board ({pendingProjects.length + activeProjects.length + draftProjects.length})
            </TabsTrigger>
            <TabsTrigger value="all-projects">
              All Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  {searchTerm ? "No clients found matching your search." : "No clients found."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
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
            )}
          </TabsContent>

          {/* Status Board Tab */}
          <TabsContent value="status-board" className="space-y-4">
            <KanbanBoardComponent
              columns={projectColumns as unknown as string[]}
              itemsByColumn={itemsByColumn as unknown as Record<string, { id: string; status: string; position: number; title: string; meta?: React.ReactNode }[]>}
              onMove={moveItem}
            />
          </TabsContent>

          {/* All Projects Tab */}
          <TabsContent value="all-projects" className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CLIENT_PENDING">Client Pending</SelectItem>
                  <SelectItem value="CONTRACTOR_REVIEWING">Contractor Reviewing</SelectItem>
                  <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredData.length === 0 ? (
              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  {searchTerm || statusFilter !== "all"
                    ? "No projects found matching your filters."
                    : "No projects found."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onStatusUpdate={handleStatusUpdate}
                    onShowProposalBuilder={() => {
                      setSelectedProject(project);
                      setShowProposalBuilder(true);
                    }}
                    onShowProposalViewer={() => {
                      setSelectedProject(project);
                      setShowProposalViewer(true);
                    }}
                    actionLoading={actionLoading}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
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
                  {projectSummary && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(projectSummary.byStatus).map(([statusKey, count], idx) => ({
                                name: getStatusDisplayInfo(statusKey as Project["status"]).label,
                                value: count,
                                status: statusKey as Project["status"],
                                color: `var(--chart-${(idx % 5) + 1})`,
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                            >
                              {Object.entries(projectSummary.byStatus).map(([,], idx) => (
                                <Cell key={`cell-${idx}`} fill={`var(--chart-${(idx % 5) + 1})`} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(val: number, _name, { payload }) => {
                              const value = val as number;
                              const pct = projectSummary.total > 0 ? (value / projectSummary.total) * 100 : 0;
                              return [`${value} (${pct.toFixed(1)}%)`, payload.name];
                            }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col justify-center gap-3">
                        {Object.entries(projectSummary.byStatus).map(([statusKey, count], idx) => {
                          const status = statusKey as Project["status"];
                          const percentage = projectSummary.total > 0 ? (count / projectSummary.total) * 100 : 0;
                          return (
                            <div key={statusKey} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-3 w-3 rounded-sm"
                                  style={{ backgroundColor: `var(--chart-${(idx % 5) + 1})` }}
                                  aria-hidden
                                />
                                <span className={getStatusDisplayInfo(status).color}>
                                  {getStatusDisplayInfo(status).label}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                  fetchProjects();
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

      {/* Proposal Viewer Modal */}
      <Dialog open={showProposalViewer} onOpenChange={(open) => {
        if (!open) {
          setShowProposalViewer(false);
          setSelectedProject(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight">
              View Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {selectedProject && (
              <ProposalViewer
                project={selectedProject}
                onClose={() => {
                  setShowProposalViewer(false);
                  setSelectedProject(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

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

export default ProjectManagementPage;

