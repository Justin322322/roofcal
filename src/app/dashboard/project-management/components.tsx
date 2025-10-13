// Components for project management page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVerticalIcon
} from "lucide-react";
import { ProjectStatusManager } from "@/components/project-status-manager";
import type { Project } from "@/types/project";

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

interface ProjectCardProps {
  project: AssignedProject;
  onStatusUpdate: (projectId: string, status: Project["status"]) => void;
  onShowProposalBuilder: () => void;
  onShowProposalViewer: () => void;
  actionLoading: string | null;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

export function ProjectCard({
  project,
  onStatusUpdate,
  onShowProposalBuilder,
  onShowProposalViewer,
  actionLoading,
  formatCurrency,
  formatDate,
}: ProjectCardProps) {
  const getAvailableActions = (status: Project["status"]) => {
    switch (status) {
      case "CLIENT_PENDING":
        return [
          { label: "Start Review", status: "CONTRACTOR_REVIEWING" as const },
        ];
      case "CONTRACTOR_REVIEWING":
        return [
          { label: "Create Proposal", status: "PROPOSAL_SENT" as const, isProposal: true },
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
  const hasProposal = project.proposalStatus && project.proposalStatus !== "DRAFT";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.projectName}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Client:</span>
                {project.client ? `${project.client.firstName} ${project.client.lastName}` : 'Unknown Client'}
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ProjectStatusManager
              project={project}
              onStatusUpdate={async (newStatus) => onStatusUpdate(project.id, newStatus)}
              compact
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasProposal ? (
                  <DropdownMenuItem onClick={onShowProposalViewer}>
                    View Proposal
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={onShowProposalBuilder}
                    disabled={project.status !== "CONTRACTOR_REVIEWING"}
                  >
                    Create Proposal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  const ok = window.confirm("Archive this project? You can unarchive later.");
                  if (!ok) return;
                  try {
                    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
                    if (res.ok) { 
                      // Refresh would be handled by parent
                    }
                  } catch { 
                    // Error handling
                  }
                }}>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-medium">{formatCurrency(project.totalCost)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Date:</span>
            <span>{formatDate(project.assignedAt || project.created_at)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Roof:</span>
            <span>{project.roofType} roof, {project.length}m × {project.width}m</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Material:</span>
            <span>{project.material}</span>
          </div>
        </div>

        {project.proposalStatus && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Proposal:</span>
            <Badge variant={project.proposalStatus === "ACCEPTED" ? "default" : "secondary"}>
              {project.proposalStatus}
            </Badge>
          </div>
        )}

        {availableActions.length > 0 && (
          <div className="flex gap-2 pt-2">
            {availableActions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant="outline"
                onClick={() => {
                  if ('isProposal' in action && action.isProposal) {
                    onShowProposalBuilder();
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

export function ClientCard({ client, onViewDetails, formatCurrency }: ClientCardProps) {
  const completionRate = client.projects.length > 0 
    ? (client.completedProjects / client.projects.length) * 100 
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Client:</span>
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
  onStatusUpdate: (projectId: string, status: Project["status"]) => void;
}

export function ClientDetailsContent({ 
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
              <span className="text-sm text-muted-foreground">Email:</span>
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
                  onStatusUpdate={async (newStatus) => onStatusUpdate(project.id, newStatus)}
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

// Components are already exported above with their function declarations
