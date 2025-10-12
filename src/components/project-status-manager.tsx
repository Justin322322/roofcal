"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDownIcon, 
  ClockIcon,
  AlertCircleIcon,
  InfoIcon
} from "lucide-react";
import { useSession } from "next-auth/react";
import type { Project, ProjectStatus } from "@/types/project";
import { UserRole } from "@/types/user-role";
import { 
  getAvailableTransitions, 
  getStatusDisplayInfo, 
  getWorkflowProgress,
  validateWorkflowTransition 
} from "@/lib/project-workflow";

interface ProjectStatusManagerProps {
  project: Project;
  onStatusUpdate: (newStatus: ProjectStatus) => Promise<void>;
  loading?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

export function ProjectStatusManager({
  project,
  onStatusUpdate,
  loading = false,
  showProgress = true,
  compact = false,
}: ProjectStatusManagerProps) {
  const { data: session } = useSession();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const userRole = session?.user?.role as UserRole;
  const currentStatusInfo = getStatusDisplayInfo(project.status);
  const availableTransitions = getAvailableTransitions(project.status, userRole);
  const progress = getWorkflowProgress(project.status);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (updatingStatus) return;

    // Validate the transition
    const validation = validateWorkflowTransition(
      project.status,
      newStatus,
      userRole,
      project.proposalSent !== null,
      project
    );

    if (!validation.isValid) {
      toast.error("Cannot change status", {
        description: validation.error,
      });
      return;
    }

    setUpdatingStatus(newStatus);
    try {
      await onStatusUpdate(newStatus);
      
      // Show success message
      const newStatusInfo = getStatusDisplayInfo(newStatus);
      toast.success("Status updated", {
        description: `Project status changed to ${newStatusInfo.label}`,
      });
    } catch {
      toast.error("Failed to update status", {
        description: "Please try again",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${currentStatusInfo.color} flex items-center gap-1`}>
          <span>{currentStatusInfo.icon}</span>
          {currentStatusInfo.label}
        </Badge>
        {availableTransitions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableTransitions.map((transition) => (
                <DropdownMenuItem
                  key={transition.to}
                  onClick={() => handleStatusChange(transition.to)}
                  disabled={updatingStatus === transition.to}
                >
                  <span className="mr-2">{getStatusDisplayInfo(transition.to).icon}</span>
                  {transition.description}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{currentStatusInfo.icon}</span>
          Project Status
        </CardTitle>
        <CardDescription>{currentStatusInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <Badge className={`${currentStatusInfo.color} flex items-center gap-1`}>
            <span>{currentStatusInfo.icon}</span>
            {currentStatusInfo.label}
          </Badge>
          
          {availableTransitions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading}>
                  Change Status
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableTransitions.map((transition) => (
                  <DropdownMenuItem
                    key={transition.to}
                    onClick={() => handleStatusChange(transition.to)}
                    disabled={updatingStatus === transition.to}
                  >
                    <span className="mr-2">{getStatusDisplayInfo(transition.to).icon}</span>
                    {transition.description}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && progress.totalSteps > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Workflow Progress</span>
              <span>{progress.step} of {progress.totalSteps} steps</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.percentage}% complete
            </p>
          </div>
        )}

        {/* Status Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Status Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current:</span>
              <span className="ml-2 font-medium">{currentStatusInfo.label}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Available Actions:</span>
              <span className="ml-2 font-medium">{availableTransitions.length}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {availableTransitions.length > 0 && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> {availableTransitions.map(t => t.description).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {/* Workflow Validation Warnings */}
        {project.status === "CONTRACTOR_REVIEWING" && !project.proposalSent && (
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Send a proposal to the client to continue the workflow.
            </AlertDescription>
          </Alert>
        )}

        {project.status === "PROPOSAL_SENT" && userRole === UserRole.CLIENT && (
          <Alert>
            <ClockIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Your Response Needed:</strong> Please review and accept or reject the contractor&apos;s proposal.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
