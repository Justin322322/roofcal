import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Standardized badge variants for consistent design
export const badgeVariants = {
  // Status badges
  draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
  "client-pending": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800",
  "for-client-review": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
  "action-required": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
  "under-review": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
  "contractor-reviewing": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
  "proposal-sent": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  accepted: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  approved: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
  declined: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
  archived: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  
  // Priority badges
  low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
  
  // Type badges
  active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  inactive: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  selected: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  default: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  
  // Material status badges
  reserved: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
  consumed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  returned: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  
  // Plan badges
  basic: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  premium: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  enterprise: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

// Standardized badge component with consistent styling
interface StandardBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StandardBadge({ variant, children, className }: StandardBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(badgeVariants[variant], className)}
    >
      {children}
    </Badge>
  );
}

// Helper functions for common badge patterns
export function getStatusBadge(status: string, proposalStatus?: string) {
  // Normalize status strings to match badge variants
  const normalizeStatus = (statusStr: string) => {
    return statusStr.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  };
  
  const statusKey = normalizeStatus(status) as BadgeVariant;
  const proposalKey = proposalStatus ? normalizeStatus(proposalStatus) as BadgeVariant : null;

  // Always prioritize archived status regardless of proposal state
  if (statusKey === 'archived') {
    return (
      <StandardBadge variant={'archived'}>
        {"Archived"}
      </StandardBadge>
    );
  }
  
  // Only use proposal status for specific meaningful states that should override project status
  const meaningfulProposalStates = ['sent', 'accepted', 'rejected', 'completed', 'revised'];
  const shouldUseProposalStatus = proposalKey && 
    meaningfulProposalStates.includes(proposalKey) && 
    badgeVariants[proposalKey];
  
  // Use proposal status only for meaningful states, otherwise use project status
  const variant = shouldUseProposalStatus ? proposalKey : statusKey;
  const displayText = shouldUseProposalStatus ? proposalStatus : status;
  
  // Fallback to default variant if the variant doesn't exist
  const finalVariant = badgeVariants[variant] ? variant : 'default';
  
  return (
    <StandardBadge variant={finalVariant}>
      {displayText}
    </StandardBadge>
  );
}

export function getPriorityBadge(priority: string) {
  const priorityKey = priority.toLowerCase() as BadgeVariant;
  return (
    <StandardBadge variant={priorityKey}>
      {priority}
    </StandardBadge>
  );
}

export function getTypeBadge(type: string, isActive?: boolean) {
  const typeKey = isActive ? 'active' : 'inactive';
  return (
    <StandardBadge variant={typeKey}>
      {type}
    </StandardBadge>
  );
}

export function getPlanBadge(plan: string) {
  const planKey = plan.toLowerCase() as BadgeVariant;
  return (
    <StandardBadge variant={planKey}>
      {plan}
    </StandardBadge>
  );
}
