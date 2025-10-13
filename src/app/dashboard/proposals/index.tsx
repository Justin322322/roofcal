"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatStatus } from "@/lib/utils";

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
      case "CLIENT_PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROPOSAL_SENT":
        return "bg-blue-100 text-blue-800";
      case "CONTRACTOR_REVIEWING":
        return "bg-orange-100 text-orange-800";
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


  const { draftProposals, pendingProposals, acceptedProposals, sentProposals } = useMemo(() => {
    if (session?.user?.role === UserRole.CLIENT) {
      return {
        draftProposals: proposals.filter(p => (p.proposalStatus || p.status) === "DRAFT"),
        pendingProposals: proposals.filter(p => (p.proposalStatus || p.status) === "CLIENT_PENDING"),
        acceptedProposals: proposals.filter(p => (p.proposalStatus || p.status) === "ACCEPTED"),
        sentProposals: proposals.filter(p => (p.proposalStatus || p.status) === "PROPOSAL_SENT"),
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

  // Redirect admins to the new project management page
  if (session?.user?.role === UserRole.ADMIN) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/project-management';
    }
    return null;
  }

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
        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
        <p className="text-muted-foreground">
          Manage and track your roofing project proposals from contractors
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

      {/* Main Content: Client View */}
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
                          {formatStatus(status)}
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