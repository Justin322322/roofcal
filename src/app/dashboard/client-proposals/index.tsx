"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  DollarSignIcon, 
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
  FileTextIcon,
  MessageSquareIcon
} from "lucide-react";
import type { Project } from "@/types/project";
import { ProposalViewer } from "../proposals/proposal-viewer";

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
let globalLoadingState = false;
let globalHasFetched = false;

// Custom hook to manage proposals data with global caching
function useProposalsData() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<ProposalProject[]>(globalProposalsCache || []);
  const [loading, setLoading] = useState(globalLoadingState);
  const hasFetched = useRef(globalHasFetched);

  const fetchProposals = useCallback(async () => {
    if (globalLoadingState) return; // Prevent duplicate requests
    
    globalLoadingState = true;
    setLoading(true);
    
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/proposals?type=received&_t=${Date.now()}`);
      
      if (response.ok) {
        const data = await response.json();
        const fetchedProposals = data.proposals || [];
        
        setProposals(fetchedProposals);
        globalProposalsCache = fetchedProposals;
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
      globalLoadingState = false;
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && session.user.role === "CLIENT") {
      // Always fetch fresh data to ensure we get the latest projects
      globalProposalsCache = null;
      globalHasFetched = false;
      hasFetched.current = false;
      fetchProposals();
    } else if (session === null) {
      // Reset cache on logout
      globalProposalsCache = null;
      globalHasFetched = false;
      hasFetched.current = false;
      setProposals([]);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session, fetchProposals]);

  return { proposals, loading, fetchProposals };
}

export function ClientProposalsPage() {
  const { data: session } = useSession();
  const { proposals, loading } = useProposalsData();
  const [selectedProject, setSelectedProject] = useState<ProposalProject | null>(null);
  const [showViewer, setShowViewer] = useState(false);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <MessageSquareIcon className="h-4 w-4" />;
      case "ACCEPTED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "REJECTED":
        return <XCircleIcon className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "DRAFT":
        return <FileTextIcon className="h-4 w-4" />;
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

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not sent";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const { pendingProposals, acceptedProposals, rejectedProposals, completedProposals } = useMemo(() => ({
    pendingProposals: proposals.filter(p => p.proposalStatus === "SENT"),
    acceptedProposals: proposals.filter(p => p.proposalStatus === "ACCEPTED"),
    rejectedProposals: proposals.filter(p => p.proposalStatus === "REJECTED"),
    completedProposals: proposals.filter(p => p.proposalStatus === "COMPLETED" || (p.proposalStatus === "ACCEPTED" && p.status === "COMPLETED")),
  }), [proposals]);

  if (session?.user?.role !== "CLIENT") {
    return (
      <div className="px-4 lg:px-6">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This page is only accessible to homeowners. You need client privileges to view your proposals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      {proposals.length === 0 ? (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            No proposals have been received yet. Create a project request and request quotes from contractors to receive proposals here.
          </AlertDescription>
        </Alert>
        ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingProposals.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedProposals.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedProposals.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingProposals.map((project) => (
                <ProposalCard
                  key={project.id}
                  project={project}
                  onViewProposal={() => {
                    setSelectedProject(project);
                    setShowViewer(true);
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {acceptedProposals.map((project) => (
                <ProposalCard
                  key={project.id}
                  project={project}
                  onViewProposal={() => {
                    setSelectedProject(project);
                    setShowViewer(true);
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rejectedProposals.map((project) => (
                <ProposalCard
                  key={project.id}
                  project={project}
                  onViewProposal={() => {
                    setSelectedProject(project);
                    setShowViewer(true);
                  }}
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
              {completedProposals.map((project) => (
                <ProposalCard
                  key={project.id}
                  project={project}
                  onViewProposal={() => {
                    setSelectedProject(project);
                    setShowViewer(true);
                  }}
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

      {/* Proposal Viewer Modal */}
      {showViewer && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>View Proposal</CardTitle>
              <CardDescription>
                Proposal details for {selectedProject.projectName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProposalViewer
                project={selectedProject}
                onClose={() => {
                  setShowViewer(false);
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

interface ProposalCardProps {
  project: ProposalProject;
  onViewProposal: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string | null) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

function ProposalCard({
  project,
  onViewProposal,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
}: ProposalCardProps) {
  const status = project.proposalStatus || "DRAFT";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.projectName}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {project.contractor.firstName} {project.contractor.lastName}
              </div>
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
            {getStatusIcon(status)}
            {status}
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
            <span>{formatDate(project.proposalSent || null)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Material:</span>
            <span>{project.material}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Area:</span>
            <span>{project.area.toFixed(1)} m²</span>
          </div>
        </div>

        <Button onClick={onViewProposal} className="w-full">
          {status === "SENT" ? "Review Proposal" : "View Proposal"}
        </Button>
      </CardContent>
    </Card>
  );
}
