"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  AlertCircleIcon,
  SearchIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react";

import type { Project, ProjectStage } from "@/types/project";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [stageProgress, setStageProgress] = useState<Record<ProjectStage, boolean>>({
    INSPECTION: false,
    ESTIMATE: false,
    MATERIALS: false,
    INSTALL: false,
    FINALIZE: false,
  });
  const [currentStage, setCurrentStage] = useState<ProjectStage>("INSPECTION");
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffContractorId, setHandoffContractorId] = useState<string>("");
  const [handoffNote, setHandoffNote] = useState<string>("");

  useEffect(() => {
    if (selectedProject) {
      setCurrentStage(selectedProject.currentStage);
      setStageProgress({
        INSPECTION: selectedProject.stageProgress?.INSPECTION ?? false,
        ESTIMATE: selectedProject.stageProgress?.ESTIMATE ?? false,
        MATERIALS: selectedProject.stageProgress?.MATERIALS ?? false,
        INSTALL: selectedProject.stageProgress?.INSTALL ?? false,
        FINALIZE: selectedProject.stageProgress?.FINALIZE ?? false,
      });
    }
  }, [selectedProject]);

  const handleSaveChecklist = async () => {
    if (!selectedProject) return;
    setActionLoading(selectedProject.id);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage, stageProgress }),
      });
      if (res.ok) {
        toast.success("Checklist saved");
        await fetchProjects();
      } else {
        const err = await res.json();
        toast.error("Failed to save", { description: err.error || "" });
      }
    } catch {
      toast.error("Failed to save", { description: "Network error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendToContractor = async () => {
    if (!selectedProject || !handoffContractorId) return;
    setActionLoading(selectedProject.id);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/send-to-contractor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId: handoffContractorId, note: handoffNote }),
      });
      if (res.ok) {
        toast.success("Sent to contractor");
        setHandoffOpen(false);
        setHandoffContractorId("");
        setHandoffNote("");
        await fetchProjects();
      } else {
        const err = await res.json();
        toast.error("Failed to send", { description: err.error || "" });
      }
    } catch {
      toast.error("Failed to send", { description: "Network error" });
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
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
        <p className="text-muted-foreground">Single-page processing with checklist and contractor handoff</p>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" onClick={fetchProjects} disabled={loading}>
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {projects.length === 0 ? (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            No projects have been assigned to you yet. Homeowners can request quotes from you through their projects.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Projects ({projects.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {projects
                  .filter((p) => !searchTerm || p.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((p) => (
                    <button
                      key={p.id}
                      className={`w-full text-left border rounded px-3 py-2 hover:bg-accent ${selectedProject?.id === p.id ? 'bg-accent/50' : ''}`}
                      onClick={() => setSelectedProject(p)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{p.projectName}</div>
                        <span className="text-xs text-muted-foreground">{p.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{p.material} • {(p.area as number).toFixed(1)} m²</div>
                    </button>
                  ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card>
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle>{selectedProject.projectName}</CardTitle>
                  <CardDescription>Manage checklist, stage, and handoff</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Current Stage</Label>
                      <Select value={currentStage} onValueChange={(v) => setCurrentStage(v as ProjectStage)}>
                        <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INSPECTION">Inspection</SelectItem>
                          <SelectItem value="ESTIMATE">Estimate</SelectItem>
                          <SelectItem value="MATERIALS">Materials</SelectItem>
                          <SelectItem value="INSTALL">Install</SelectItem>
                          <SelectItem value="FINALIZE">Finalize</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleSaveChecklist} disabled={actionLoading === selectedProject.id}>Save</Button>
                      <Button variant="outline" onClick={() => setHandoffOpen(true)}>
                        <SendIcon className="h-4 w-4 mr-2" /> Send to Contractor
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Checklist</Label>
                    {(["INSPECTION","ESTIMATE","MATERIALS","INSTALL","FINALIZE"] as ProjectStage[]).map((stage) => (
                      <label key={stage} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!!stageProgress[stage]}
                          onCheckedChange={(checked) => setStageProgress((prev) => ({ ...prev, [stage]: !!checked }))}
                        />
                        <span>{stage.charAt(0) + stage.slice(1).toLowerCase()}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1 block">Material</Label>
                      <p className="text-sm text-muted-foreground">{selectedProject.material}</p>
                    </div>
                    <div>
                      <Label className="mb-1 block">Area</Label>
                      <p className="text-sm text-muted-foreground">{(selectedProject.area as number).toFixed(1)} m²</p>
                    </div>
                    <div>
                      <Label className="mb-1 block">Status</Label>
                      <p className="text-sm text-muted-foreground">{selectedProject.status}</p>
                    </div>
                    <div>
                      <Label className="mb-1 block">Client</Label>
                      <p className="text-sm text-muted-foreground">{selectedProject.clientName || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>Select a project to manage</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Send to Contractor Modal */}
      <Dialog open={handoffOpen} onOpenChange={setHandoffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send to Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Contractor</Label>
              <Select value={handoffContractorId} onValueChange={setHandoffContractorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contractor" />
                </SelectTrigger>
                <SelectContent>
                  {/* Expect /api/contractors to return a list; we fetch on open via simple trick */}
                  {(clients as any[]) /* reuse client structure as placeholder if no contractor list is available */
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Note</Label>
              <Input placeholder="Optional note" value={handoffNote} onChange={(e) => setHandoffNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHandoffOpen(false)}>Cancel</Button>
              <Button onClick={handleSendToContractor} disabled={!handoffContractorId}>Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectManagementPage;

