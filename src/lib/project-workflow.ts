import type { Project, ProjectStatus, ProposalStatus } from "@/types/project";
import { UserRole } from "@/types/user-role";
import {
  FileEditIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  SendIcon,
  ConstructionIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ArchiveIcon,
} from "lucide-react";

export interface WorkflowTransition {
  from: ProjectStatus;
  to: ProjectStatus;
  allowedRoles: UserRole[];
  description: string;
  requiresProposal?: boolean;
  autoUpdateProposalStatus?: ProposalStatus;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Initial project creation
  {
    from: "DRAFT",
    to: "ACTIVE",
    allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
    description: "Make project active for personal use",
  },
  
  // Quote request workflow
  {
    from: "DRAFT",
    to: "CLIENT_PENDING",
    allowedRoles: [UserRole.CLIENT],
    description: "Request quote from contractor",
  },
  {
    from: "CLIENT_PENDING",
    to: "CONTRACTOR_REVIEWING",
    allowedRoles: [UserRole.ADMIN],
    description: "Start reviewing project details",
  },
  {
    from: "CONTRACTOR_REVIEWING",
    to: "PROPOSAL_SENT",
    allowedRoles: [UserRole.ADMIN],
    description: "Send proposal to client",
    requiresProposal: true,
    autoUpdateProposalStatus: "SENT",
  },
  
  // Proposal response workflow
  {
    from: "PROPOSAL_SENT",
    to: "ACCEPTED",
    allowedRoles: [UserRole.CLIENT],
    description: "Accept contractor's proposal",
    autoUpdateProposalStatus: "ACCEPTED",
  },
  {
    from: "PROPOSAL_SENT",
    to: "REJECTED",
    allowedRoles: [UserRole.CLIENT],
    description: "Reject contractor's proposal",
    autoUpdateProposalStatus: "REJECTED",
  },
  
  // Project execution workflow
  {
    from: "ACCEPTED",
    to: "IN_PROGRESS",
    allowedRoles: [UserRole.ADMIN],
    description: "Start project work",
  },
  {
    from: "IN_PROGRESS",
    to: "COMPLETED",
    allowedRoles: [UserRole.ADMIN],
    description: "Mark project as completed",
  },
  
  // Revision workflow
  {
    from: "REJECTED",
    to: "CONTRACTOR_REVIEWING",
    allowedRoles: [UserRole.ADMIN],
    description: "Revise proposal based on feedback",
  },
  {
    from: "CONTRACTOR_REVIEWING",
    to: "REJECTED",
    allowedRoles: [UserRole.ADMIN],
    description: "Withdraw from project",
    autoUpdateProposalStatus: "REJECTED",
  },
  
  // Archive workflow
  {
    from: "COMPLETED",
    to: "ARCHIVED",
    allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
    description: "Archive completed project",
  },
  {
    from: "REJECTED",
    to: "ARCHIVED",
    allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
    description: "Archive rejected project",
  },
  {
    from: "ARCHIVED",
    to: "COMPLETED",
    allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
    description: "Unarchive project",
  },
];

export interface WorkflowValidation {
  isValid: boolean;
  error?: string;
  requiredFields?: string[];
  autoUpdates?: {
    proposalStatus?: ProposalStatus;
  };
}

export function validateWorkflowTransition(
  fromStatus: ProjectStatus,
  toStatus: ProjectStatus,
  userRole: UserRole,
  hasProposal?: boolean,
  project?: Project
): WorkflowValidation {
  // Find the transition
  const transition = WORKFLOW_TRANSITIONS.find(
    t => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) {
    return {
      isValid: false,
      error: `Invalid transition from ${fromStatus} to ${toStatus}`,
    };
  }

  // Check if user role is allowed
  if (!transition.allowedRoles.includes(userRole)) {
    return {
      isValid: false,
      error: `Only ${transition.allowedRoles.join(" or ")} users can perform this action`,
    };
  }

  // Check if proposal is required
  if (transition.requiresProposal && !hasProposal) {
    return {
      isValid: false,
      error: "A proposal must be sent before this transition",
      requiredFields: ["proposalText"],
    };
  }

  // Check specific business rules
  if (fromStatus === "PROPOSAL_SENT" && toStatus === "ACCEPTED") {
    if (!project?.contractorId) {
      return {
        isValid: false,
        error: "Project must be assigned to a contractor",
      };
    }
  }

  if (fromStatus === "CONTRACTOR_REVIEWING" && toStatus === "PROPOSAL_SENT") {
    if (!project?.clientId) {
      return {
        isValid: false,
        error: "Project must be assigned to a client",
      };
    }
  }

  return {
    isValid: true,
    autoUpdates: transition.autoUpdateProposalStatus ? {
      proposalStatus: transition.autoUpdateProposalStatus,
    } : undefined,
  };
}

export function getAvailableTransitions(
  currentStatus: ProjectStatus,
  userRole: UserRole
): WorkflowTransition[] {
  return WORKFLOW_TRANSITIONS.filter(
    transition => 
      transition.from === currentStatus && 
      transition.allowedRoles.includes(userRole)
  );
}

export function getStatusDisplayInfo(status: ProjectStatus) {
  const statusInfo = {
    DRAFT: {
      label: "Draft",
      description: "Project is being prepared",
      color: "bg-gray-100 text-gray-800",
      icon: FileEditIcon,
    },
    ACTIVE: {
      label: "Active",
      description: "Project is active for personal use",
      color: "bg-blue-100 text-blue-800",
      icon: CheckCircleIcon,
    },
    CLIENT_PENDING: {
      label: "Pending Review",
      description: "Waiting for contractor to review",
      color: "bg-yellow-100 text-yellow-800",
      icon: ClockIcon,
    },
    CONTRACTOR_REVIEWING: {
      label: "Under Review",
      description: "Contractor is reviewing project",
      color: "bg-orange-100 text-orange-800",
      icon: SearchIcon,
    },
    PROPOSAL_SENT: {
      label: "Proposal Sent",
      description: "Waiting for client response",
      color: "bg-blue-100 text-blue-800",
      icon: SendIcon,
    },
    ACCEPTED: {
      label: "Accepted",
      description: "Proposal accepted, ready to start",
      color: "bg-green-100 text-green-800",
      icon: CheckCircleIcon,
    },
    IN_PROGRESS: {
      label: "In Progress",
      description: "Work is currently underway",
      color: "bg-blue-100 text-blue-800",
      icon: ConstructionIcon,
    },
    COMPLETED: {
      label: "Completed",
      description: "Project has been completed",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2Icon,
    },
    REJECTED: {
      label: "Rejected",
      description: "Proposal was rejected",
      color: "bg-red-100 text-red-800",
      icon: XCircleIcon,
    },
    ARCHIVED: {
      label: "Archived",
      description: "Project has been archived",
      color: "bg-gray-100 text-gray-800",
      icon: ArchiveIcon,
    },
  };

  return statusInfo[status];
}

export function getWorkflowProgress(currentStatus: ProjectStatus): {
  step: number;
  totalSteps: number;
  percentage: number;
} {
  const workflowSteps: ProjectStatus[] = [
    "DRAFT",
    "CLIENT_PENDING", 
    "CONTRACTOR_REVIEWING",
    "PROPOSAL_SENT",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED"
  ];

  const stepIndex = workflowSteps.indexOf(currentStatus);
  
  if (stepIndex === -1) {
    return { step: 0, totalSteps: workflowSteps.length, percentage: 0 };
  }

  return {
    step: stepIndex + 1,
    totalSteps: workflowSteps.length,
    percentage: Math.round(((stepIndex + 1) / workflowSteps.length) * 100),
  };
}
