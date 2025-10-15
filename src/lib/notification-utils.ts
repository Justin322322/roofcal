/**
 * Utility functions for handling notifications
 */

export interface NotificationData {
  id: string;
  type: "proposal_sent" | "proposal_accepted" | "proposal_rejected" | "status_change" | "project_assigned" | "HELP_REQUEST";
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

/**
 * Generate navigation URL based on notification type and data
 */
export const getNotificationUrl = (notification: NotificationData): string => {
  // If there's a specific actionUrl, use it
  if (notification.actionUrl) {
    return notification.actionUrl;
  }

  // Otherwise, generate URL based on type
  switch (notification.type) {
    case "proposal_sent":
    case "proposal_accepted":
    case "proposal_rejected":
      return "/dashboard?tab=roof-calculator";
    case "status_change":
    case "project_assigned":
      // For project-related notifications, navigate to roof-calculator tab
      return "/dashboard?tab=roof-calculator";
    default:
      return "/dashboard?tab=roof-calculator";
  }
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type: NotificationData["type"]) => {
  const iconProps = "h-4 w-4";
  
  switch (type) {
    case "proposal_sent":
      return { icon: "MessageSquareIcon", className: `${iconProps} text-blue-600` };
    case "proposal_accepted":
      return { icon: "CheckCircleIcon", className: `${iconProps} text-green-600` };
    case "proposal_rejected":
      return { icon: "AlertCircleIcon", className: `${iconProps} text-red-600` };
    case "status_change":
      return { icon: "ClockIcon", className: `${iconProps} text-orange-600` };
    case "project_assigned":
      return { icon: "CheckIcon", className: `${iconProps} text-purple-600` };
    case "HELP_REQUEST":
      return { icon: "HelpCircleIcon", className: `${iconProps} text-orange-600` };
    default:
      return { icon: "BellIcon", className: `${iconProps} text-gray-600` };
  }
};
