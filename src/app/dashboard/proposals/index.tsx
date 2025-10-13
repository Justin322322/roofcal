"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  RefreshCwIcon,
  DownloadIcon,
  MoreVerticalIcon,
  SearchIcon,
  FileTextIcon,
  MessageSquareIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";
import type { Project } from "@/types/project";
import { UserRole } from "@/types/user-role";
import { ProposalBuilder } from "./proposal-builder";
import { ProposalViewer } from "./proposal-viewer";
import { KanbanBoardComponent } from "@/components/kanban/kanban-board";
import { useKanban } from "@/hooks/use-kanban";

interface ProposalProject extends Project {
  contractor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Global cache for proposals data to prevent re-fetching on tab switches
let globalProposalsCache: ProposalProject[] | null = null;
let globalProposalsLoading = false;
let globalProposalsHasFetched = false;

// Custom hook to manage proposals data with global caching
function useProposalsData() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<ProposalProject[]>(globalProposalsCache || []);
  const [loading, setLoading] = useState(globalProposalsLoading);
  const hasFetched = useRef(globalProposalsHasFetched);

  const fetchProposals = useCallback(async () => {
    if (globalProposalsLoading) return; // Prevent duplicate requests
    
    globalProposalsLoading = true;
    setLoading(true);
    
    try {
      // Add timestamp to prevent caching and use appropriate endpoint based on role
      const endpoint = session?.user?.role === UserRole.CLIENT 
        ? `/api/proposals?_t=${Date.now()}` // Use default endpoint for clients to get all their projects
        : `/api/proposals?_t=${Date.now()}`;
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        const fetchedProposals = data.proposals || [];
        
        setProposals(fetchedProposals);
        globalProposalsCache = fetchedProposals;
        globalProposalsHasFetched = true;
        hasFetched.current = true;
      } else {
        const errorData = await response.json();
        toast.error("Failed to fetch proposals", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to fetch proposals", {
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
      globalProposalsLoading = false;
    }
  }, [session?.user?.role]);

  useEffect(() => {
    if (session?.user?.id) {
      // Only fetch if we haven't fetched before or if cache is empty
      if (!hasFetched.current || !globalProposalsCache) {
        fetchProposals();
      }
    } else if (session === null) {
      // Reset cache on logout
      globalProposalsCache = null;
      globalProposalsHasFetched = false;
      hasFetched.current = false;
      setProposals([]);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session, fetchProposals]);

  return { proposals, loading, fetchProposals };
}

export function ProposalsPage() {
  const { data: session } = useSession();
  const { proposals, loading, fetchProposals } = useProposalsData();
  const [selectedProject, setSelectedProject] = useState<ProposalProject | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingToContractor, setSendingToContractor] = useState<string | null>(null);

  // Filter proposals for client view
  const filteredProposals = useMemo(() => {
    let filtered = proposals;
    
    if (session?.user?.role === UserRole.CLIENT) {
      // For clients, only show their own projects
      filtered = proposals.filter(p => p.userId === session?.user?.id);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.material.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => {
        const status = p.proposalStatus || p.status;
        return status === statusFilter;
      });
    }
    
    return filtered;
  }, [proposals, searchTerm, statusFilter, session]);

  // Kanban setup (only for admins - clients don't need project management kanban)
  const proposalColumns = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "REVISED", "COMPLETED"] as const;
  const kanbanItems = useMemo(
    () =>
      proposals.map((p) => ({
        id: p.id,
        title: p.projectName,
        status: (p.proposalStatus || "DRAFT") as string,
        position: (p as unknown as { proposalPosition?: number }).proposalPosition ?? 0,
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
            <div className="text-xs text-muted-foreground">
              Client: {p.clientName || 'Unknown'}
            </div>
          </div>
        ),
      })),
    [proposals]
  );

  const { itemsByColumn, moveItem } = useKanban(kanbanItems, {
    columns: (proposalColumns as unknown as string[]),
    onReorder: async (items) => {
      await fetch("/api/proposals/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      await fetchProposals();
    },
    canMove: (item, toStatus) => {
      const role = session?.user?.role;
      const from = item.status;
      if (role === "ADMIN") {
        // Admin may move to SENT/REVISED from any except COMPLETED
        if (toStatus === "SENT" || toStatus === "REVISED") return from !== "COMPLETED";
        // Cannot set ACCEPTED/REJECTED via drag
        if (toStatus === "ACCEPTED" || toStatus === "REJECTED") return false;
        return toStatus === from; // allow reordering within same column
      }
      // Client can only move from SENT/REVISED to ACCEPTED/REJECTED
      if ((from === "SENT" || from === "REVISED") && (toStatus === "ACCEPTED" || toStatus === "REJECTED")) return true;
      // Reordering within same col allowed except terminal states
      if (toStatus === from && !["ACCEPTED", "REJECTED", "COMPLETED"].includes(from)) return true;
      return false;
    },
  });

  const handleSendToContractor = async (project: ProposalProject) => {
    setSendingToContractor(project.id);
    try {
      // Assign the project to the first available contractor
      const response = await fetch(`/api/projects/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          // We'll let the API find the first available contractor
        }),
      });

      if (response.ok) {
        toast.success("Project has been assigned to a contractor for review");
        // Clear global cache to ensure fresh data
        globalProposalsCache = [];
        globalProposalsHasFetched = false;
        fetchProposals(); // Refresh the proposals list
      } else {
        const errorData = await response.json();
        toast.error("Failed to assign project to contractor", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to send project to contractor", {
        description: "Network error occurred",
      });
    } finally {
      setSendingToContractor(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Removed unused getStatusIcon helper

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not sent";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportToCSV = async () => {
    try {
      const csvContent = [
        ['Project Name', session?.user?.role === UserRole.CLIENT ? 'Contractor' : 'Client', 'Status', 'Total Cost', 'Area (m²)', 'Material', 'Date Sent'],
        ...proposals.map((project) => [
          project.projectName,
          session?.user?.role === UserRole.CLIENT 
            ? (project.contractor ? `${project.contractor.firstName} ${project.contractor.lastName}` : 'Not assigned')
            : `${project.client.firstName} ${project.client.lastName}`,
          project.proposalStatus || 'DRAFT',
          formatCurrency(project.totalCost),
          project.area.toFixed(1),
          project.material,
          formatDate(project.proposalSent || null),
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `proposals-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export completed', {
        description: 'Proposals exported successfully',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: 'Failed to export proposals',
      });
    }
  };

  // Filter data based on selected filters
  const filteredData = proposals.filter((project) => {
    const matchesSearch = !searchTerm ||
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session?.user?.role === UserRole.CLIENT 
        ? (project.contractor && `${project.contractor.firstName} ${project.contractor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
        : `${project.client.firstName} ${project.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      project.material.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      project.proposalStatus === statusFilter ||
      (statusFilter === "COMPLETED" && (project.proposalStatus === "COMPLETED" || (project.proposalStatus === "ACCEPTED" && project.status === "COMPLETED")));

    return matchesSearch && matchesStatus;
  });

  const { draftProposals, pendingProposals, acceptedProposals, sentProposals } = useMemo(() => {
    if (session?.user?.role === UserRole.CLIENT) {
      return {
        draftProposals: proposals.filter(p => p.proposalStatus === "DRAFT"),
        pendingProposals: proposals.filter(p => p.proposalStatus === "SENT"),
        acceptedProposals: proposals.filter(p => p.proposalStatus === "ACCEPTED"),
        sentProposals: [],
      };
    } else {
      return {
        draftProposals: proposals.filter(p => !p.proposalSent && p.contractorId),
        pendingProposals: [],
        acceptedProposals: proposals.filter(p => p.proposalStatus === "ACCEPTED"),
        sentProposals: proposals.filter(p => p.proposalStatus === "SENT"),
      };
    }
  }, [proposals, session?.user?.role]);

  const totalProposals = proposals.length;
  const draftCount = draftProposals.length;
  const pendingCount = pendingProposals.length;
  const acceptedCount = acceptedProposals.length;
  const sentCount = sentProposals.length;
  // Removed unused rejectedCount

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="mb-4 flex justify-end">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
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

        {/* Main Content Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Controls Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-[200px]" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <p className="text-muted-foreground">
          {session?.user?.role === "CLIENT" 
            ? "Manage and track your roofing project proposals from contractors"
            : "Manage your proposals and track their status with clients"
          }
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProposals} disabled={loading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProposals}</div>
              <p className="text-xs text-muted-foreground">All proposals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Proposals</CardTitle>
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftCount}</div>
              <p className="text-xs text-muted-foreground">
                {session?.user?.role === UserRole.CLIENT ? "Not sent to contractors" : "Not sent to clients"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {session?.user?.role === UserRole.CLIENT ? "Pending Proposals" : "Sent Proposals"}
              </CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session?.user?.role === UserRole.CLIENT ? pendingCount : sentCount}</div>
              <p className="text-xs text-muted-foreground">
                {session?.user?.role === UserRole.CLIENT ? "Waiting for review" : "Sent to clients"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted Proposals</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acceptedCount}</div>
              <p className="text-xs text-muted-foreground">Approved by client</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content: List | Board */}
      {session?.user?.role === UserRole.ADMIN ? (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proposals</CardTitle>
                  <CardDescription>
                    {(session?.user?.role as string) === "CLIENT" 
                      ? "Review and manage proposals for your roofing projects"
                      : "Review and manage proposals you've sent to clients"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <FileTextIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Proposals Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your filters to see more results."
                      : (session?.user?.role as string) === "CLIENT"
                        ? "Create a project using the Roof Calculator to get started, or wait for proposals from contractors."
                        : "You need to have projects assigned to you before you can create proposals."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>{(session?.user?.role as string) === "CLIENT" ? "Contractor" : "Client"}</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Date Sent</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((project) => {
                        const status = project.proposalStatus || "DRAFT";
                        return (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.projectName}</TableCell>
                            <TableCell>
                              {session?.user?.role === UserRole.CLIENT ? (
                                status === "DRAFT" ? (
                                  <span className="text-muted-foreground">Not assigned</span>
                                ) : (
                                  project.contractor ? `${project.contractor.firstName} ${project.contractor.lastName}` : 'Unknown'
                                )
                              ) : (
                                `${project.client.firstName} ${project.client.lastName}`
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(status)} px-2 py-1 text-xs font-medium`}>{status}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(project.totalCost)}</TableCell>
                            <TableCell>{project.area.toFixed(1)} m²</TableCell>
                            <TableCell>{project.material}</TableCell>
                            <TableCell>{formatDate(project.proposalSent || null)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVerticalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedProject(project); setShowViewer(true); }}>View Proposal</DropdownMenuItem>
                                  {session?.user?.role === UserRole.ADMIN && status === "DRAFT" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => { setSelectedProject(project); setShowBuilder(true); }}>Create Proposal</DropdownMenuItem>
                                    </>
                                  )}
                                  {session?.user?.role === UserRole.CLIENT && status === "DRAFT" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleSendToContractor(project)}
                                        disabled={sendingToContractor === project.id}
                                        className="flex items-center gap-2"
                                      >
                                        {sendingToContractor === project.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            Sending...
                                          </>
                                        ) : (
                                          "Send to Contractor"
                                        )}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={async () => {
                                    const ok = window.confirm("Archive this project? You can unarchive later.");
                                    if (!ok) return;
                                    try {
                                      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
                                      if (res.ok) { toast.success("Project archived"); fetchProposals(); }
                                      else { const err = await res.json().catch(() => ({})); toast.error("Failed to archive", { description: err.error || "Unknown error" }); }
                                    } catch { toast.error("Failed to archive", { description: "Network error" }); }
                                  }}>Archive</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="board">
            <KanbanBoardComponent
              columns={proposalColumns as unknown as string[]}
              itemsByColumn={itemsByColumn as unknown as Record<string, { id: string; status: string; position: number; title: string; meta?: React.ReactNode }[]>}
              onMove={moveItem}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>
                  Track your roofing project requests and proposals
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="CLIENT_PENDING">Pending</SelectItem>
                    <SelectItem value="CONTRACTOR_REVIEWING">Reviewing</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-8">
                <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first roofing project to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProposals.map((project) => {
                  const status = project.proposalStatus || project.status;
                  return (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="space-y-1">
                          <h3 className="font-medium">{project.projectName}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Area: {(project.area as number).toFixed(1)} m²</span>
                            <span>Material: {project.material}</span>
                            <span>Cost: {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(project.totalCost)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(status)} px-3 py-1`}>
                          {status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedProject(project); setShowViewer(true); }}>View Details</DropdownMenuItem>
                            {status === "DRAFT" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleSendToContractor(project)}
                                  disabled={sendingToContractor === project.id}
                                  className="flex items-center gap-2"
                                >
                                  {sendingToContractor === project.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                      Sending...
                                    </>
                                  ) : (
                                    "Send to Contractor"
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proposal Builder Modal */}
      {showBuilder && selectedProject && (
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
                  fetchProposals();
                  setShowBuilder(false);
                  setSelectedProject(null);
                }}
                onClose={() => {
                  setShowBuilder(false);
                  setSelectedProject(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proposal Viewer Modal */}
      <Dialog open={showViewer} onOpenChange={(open) => {
        if (!open) {
          setShowViewer(false);
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
                  setShowViewer(false);
                  setSelectedProject(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}