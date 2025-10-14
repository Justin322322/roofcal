import { sendCustomEmail, type EmailTemplateData } from "@/lib/email";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export interface NotificationData {
  type: "status_change" | "proposal_sent" | "proposal_accepted" | "proposal_rejected" | "project_assigned" | "quote_requested" | "low_stock" | "project_completed" | "project_accepted" | "maintenance_start" | "maintenance_end";
  projectId: string;
  projectName: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  toUserEmail: string;
  status?: string;
  message?: string;
  warehouseName?: string;
  materialName?: string;
  currentStock?: number;
  threshold?: number;
}

export async function sendProjectNotification(notification: NotificationData) {
  try {
    const emailContent = generateEmailContent(notification);

    // Send email notification using branded template
    await sendCustomEmail(
      notification.toUserEmail,
      emailContent.subject,
      emailContent.templateData,
      emailContent.text
    );

    // Create in-app notification in database
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: notification.toUserId,
        type: notification.type,
        title: emailContent.subject,
        message: generateInAppMessage(notification),
        projectId: notification.projectId,
        projectName: notification.projectName,
        actionUrl: `/dashboard?tab=roof-calculator`,
      },
    });

    console.log(`Notification sent to ${notification.toUserEmail} for project ${notification.projectName}`);
    return true;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return false;
  }
}

function generateInAppMessage(notification: NotificationData): string {
  switch (notification.type) {
    case "status_change":
      return `Project "${notification.projectName}" status changed to ${notification.status}`;
    case "proposal_sent":
      return `New proposal received for "${notification.projectName}" from ${notification.fromUserName}`;
    case "proposal_accepted":
      return `Your proposal for "${notification.projectName}" was accepted by ${notification.fromUserName}`;
    case "proposal_rejected":
      return `Your proposal for "${notification.projectName}" was not accepted by ${notification.fromUserName}`;
    case "project_assigned":
      return `Project "${notification.projectName}" ready for review from ${notification.fromUserName}`;
    case "quote_requested":
      return `New quote request for "${notification.projectName}" from ${notification.fromUserName}`;
    case "project_completed":
      return `Project "${notification.projectName}" has been completed by ${notification.fromUserName}`;
    case "project_accepted":
      return `Project "${notification.projectName}" has been accepted by ${notification.fromUserName}`;
    case "low_stock":
      return `Low stock: ${notification.materialName} at ${notification.warehouseName} (current: ${notification.currentStock})`;
    default:
      return `Update for project "${notification.projectName}"`;
  }
}

function generateEmailContent(notification: NotificationData): {
  subject: string;
  templateData: EmailTemplateData;
  text: string;
} {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const projectUrl = `${baseUrl}/dashboard?tab=roof-calculator`;
  
  switch (notification.type) {
    case "status_change":
      return {
        subject: `Project Status Updated: ${notification.projectName}`,
        templateData: {
          title: "Project Status Update",
          heading: "Project Status Update",
          content: `Hello ${notification.toUserName},<br/><br/>The status of your project <strong>"${notification.projectName}"</strong> has been updated to <strong>${notification.status}</strong>.<br/><br/><strong>Updated by:</strong> ${notification.fromUserName}.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Project
              </a>
            </div>
          `,
          securityNotice: "If you have any questions, please contact your contractor.",
        },
        text: `Project Status Update\n\nHello ${notification.toUserName},\n\nThe status of your project "${notification.projectName}" has been updated to ${notification.status}.\n\nUpdated by: ${notification.fromUserName}\n\nView project: ${projectUrl}\n\nIf you have any questions, please contact your contractor.`,
      };

    case "proposal_sent":
      return {
        subject: `New Proposal Received: ${notification.projectName}`,
        templateData: {
          title: "New Proposal Received",
          heading: "New Proposal Received",
          content: `Hello ${notification.toUserName},<br/><br/>You have received a new proposal for your project <strong>"${notification.projectName}"</strong> from ${notification.fromUserName}.<br/>Please review the proposal and accept or reject it at your earliest convenience.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Review Proposal
              </a>
            </div>
          `,
          securityNotice: "This proposal will remain valid for 30 days.",
        },
        text: `New Proposal Received\n\nHello ${notification.toUserName},\n\nYou have received a new proposal for your project "${notification.projectName}" from ${notification.fromUserName}.\n\nPlease review the proposal and accept or reject it at your earliest convenience.\n\nReview proposal: ${projectUrl}\n\nThis proposal will remain valid for 30 days.`,
      };

    case "proposal_accepted":
      return {
        subject: `Proposal Accepted: ${notification.projectName}`,
        templateData: {
          title: "Proposal Accepted",
          heading: "Proposal Accepted",
          content: `Hello ${notification.toUserName},<br/><br/>Great news! Your proposal for the project <strong>"${notification.projectName}"</strong> has been accepted by ${notification.fromUserName}.<br/>The project is now ready to begin. Please contact the client to schedule the start date.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Project
              </a>
            </div>
          `,
          securityNotice: "Congratulations on securing this project!",
        },
        text: `Proposal Accepted\n\nHello ${notification.toUserName},\n\nGreat news! Your proposal for the project "${notification.projectName}" has been accepted by ${notification.fromUserName}.\n\nThe project is now ready to begin. Please contact the client to schedule the start date.\n\nView project: ${projectUrl}\n\nCongratulations on securing this project!`,
      };

    case "proposal_rejected":
      return {
        subject: `Proposal Update: ${notification.projectName}`,
        templateData: {
          title: "Proposal Update",
          heading: "Proposal Update",
          content: `Hello ${notification.toUserName},<br/><br/>Your proposal for the project <strong>"${notification.projectName}"</strong> was not accepted by ${notification.fromUserName}.<br/>You can review the project details and consider revising your proposal if needed.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Project
              </a>
            </div>
          `,
          securityNotice: "Feel free to contact the client for feedback or clarification.",
        },
        text: `Proposal Update\n\nHello ${notification.toUserName},\n\nYour proposal for the project "${notification.projectName}" was not accepted by ${notification.fromUserName}.\n\nYou can review the project details and consider revising your proposal if needed.\n\nView project: ${projectUrl}\n\nFeel free to contact the client for feedback or clarification.`,
      };

    case "project_assigned":
      return {
        subject: `Project Ready for Review: ${notification.projectName}`,
        templateData: {
          title: "Project Ready for Review",
          heading: "Project Ready for Review",
          content: `Hello ${notification.toUserName},<br/><br/>A new project <strong>"${notification.projectName}"</strong> is ready for your review. The client ${notification.fromUserName} has submitted their project details and is requesting a proposal.<br/>Please review the project specifications and prepare a detailed proposal for the client.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Review Project
              </a>
            </div>
          `,
          securityNotice: "Access the project details in your contractor dashboard to begin your review and create a proposal.",
        },
        text: `Project Ready for Review\n\nHello ${notification.toUserName},\n\nA new project "${notification.projectName}" is ready for your review. The client ${notification.fromUserName} has submitted their project details and is requesting a proposal.\n\nPlease review the project specifications and prepare a detailed proposal for the client.\n\nReview project: ${projectUrl}\n\nAccess the project details in your contractor dashboard to begin your review and create a proposal.`,
      };

    case "quote_requested":
      return {
        subject: `New Quote Request: ${notification.projectName}`,
        templateData: {
          title: "New Quote Request",
          heading: "New Quote Request",
          content: `Hello ${notification.toUserName},<br/><br/>You have received a new quote request for the project <strong>"${notification.projectName}"</strong> from ${notification.fromUserName}.<br/>Please review the project details and create a custom proposal for the client.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Review & Create Proposal
              </a>
            </div>
          `,
          securityNotice: "Please respond to this quote request within 48 hours to maintain good client relationships.",
        },
        text: `New Quote Request\n\nHello ${notification.toUserName},\n\nYou have received a new quote request for the project "${notification.projectName}" from ${notification.fromUserName}.\n\nPlease review the project details and create a custom proposal for the client.\n\nReview project: ${projectUrl}\n\nPlease respond to this quote request within 48 hours to maintain good client relationships.`,
      };

    case "project_completed":
      return {
        subject: `Project Completed: ${notification.projectName}`,
        templateData: {
          title: "Project Completed",
          heading: "Project Completed",
          content: `Hello ${notification.toUserName},<br/><br/>Great news! Your project <strong>"${notification.projectName}"</strong> has been completed by ${notification.fromUserName}.<br/>The roofing work is now finished and ready for your review.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Completed Project
              </a>
            </div>
          `,
          securityNotice: "Please review the completed work and contact your contractor if you have any questions.",
        },
        text: `Project Completed\n\nHello ${notification.toUserName},\n\nGreat news! Your project "${notification.projectName}" has been completed by ${notification.fromUserName}.\n\nThe roofing work is now finished and ready for your review.\n\nView project: ${projectUrl}\n\nPlease review the completed work and contact your contractor if you have any questions.`,
      };

    case "project_accepted":
      return {
        subject: `Project Accepted: ${notification.projectName}`,
        templateData: {
          title: "Project Accepted",
          heading: "Project Accepted",
          content: `Hello ${notification.toUserName},<br/><br/>Your project <strong>"${notification.projectName}"</strong> has been accepted by ${notification.fromUserName}.<br/>The contractor is now ready to begin work on your roofing project.`,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Project
              </a>
            </div>
          `,
          securityNotice: "Your contractor will contact you soon to schedule the project start date.",
        },
        text: `Project Accepted\n\nHello ${notification.toUserName},\n\nYour project "${notification.projectName}" has been accepted by ${notification.fromUserName}.\n\nThe contractor is now ready to begin work on your roofing project.\n\nView project: ${projectUrl}\n\nYour contractor will contact you soon to schedule the project start date.`,
      };

    case "low_stock": {
      const title = `Low Stock Alert: ${notification.materialName}`;
      const contentHtml = `Hello ${notification.toUserName},<br/><br/>Material <strong>${notification.materialName}</strong> at warehouse <strong>${notification.warehouseName}</strong> is below threshold.<br/><br/><strong>Current stock:</strong> ${notification.currentStock} (threshold: ${notification.threshold}).`;
      return {
        subject: title,
        templateData: {
          title,
          heading: title,
          content: contentHtml,
          actionContent: `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Dashboard
              </a>
            </div>
          `,
          securityNotice: "Consider restocking or reallocating materials to avoid project delays.",
        },
        text: `Low Stock Alert\n\nMaterial ${notification.materialName} at warehouse ${notification.warehouseName} is below threshold.\nCurrent stock: ${notification.currentStock} (threshold: ${notification.threshold}).\n\nOpen dashboard: ${projectUrl}`,
      };
    }

    default:
      throw new Error(`Unknown notification type: ${notification.type}`);
  }
}

// Helper function to send status change notifications
export async function notifyStatusChange(
  projectId: string,
  projectName: string,
  newStatus: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "status_change",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
    status: newStatus,
  });
}

// Helper function to send proposal notifications
export async function notifyProposalSent(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "proposal_sent",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

export async function notifyProposalAccepted(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "proposal_accepted",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

export async function notifyProposalRejected(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "proposal_rejected",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

export async function notifyProjectAssigned(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "project_assigned",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

export async function notifyQuoteRequested(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "quote_requested",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

export async function notifyProjectCompleted(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "project_completed",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

export async function notifyProjectAccepted(
  projectId: string,
  projectName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  toUserEmail: string
) {
  return sendProjectNotification({
    type: "project_accepted",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
  });
}

// Helper: notify low stock (warehouse/material scoped, not tied to a specific project)
export async function notifyLowStock(
  {
    projectId = "system",
    projectName = "Inventory",
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
    warehouseName,
    materialName,
    currentStock,
    threshold,
  }: {
    projectId?: string;
    projectName?: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    toUserEmail: string;
    warehouseName: string;
    materialName: string;
    currentStock: number;
    threshold: number;
  }
) {
  return sendProjectNotification({
    type: "low_stock",
    projectId,
    projectName,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    toUserEmail,
    warehouseName,
    materialName,
    currentStock,
    threshold,
  });
}

/**
 * Send notification when admin creates a project for a customer
 */
export async function notifyCustomerProjectCreated(
  customerId: string,
  projectId: string,
  adminName: string
) {
  try {
    // Get project details for the notification
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        projectName: true,
        totalCost: true,
        material: true,
        area: true,
      },
    });

    if (!project) {
      console.error(`Project ${projectId} not found for admin creation notification`);
      return;
    }

    // Create notification for customer
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: customerId,
        type: "PROJECT_CREATED_BY_ADMIN",
        title: "New Project Created",
        message: `${adminName} created a roofing project for you`,
        projectId: projectId,
        projectName: project.projectName,
        actionUrl: `/dashboard?tab=my-projects`,
        read: false,
        created_at: new Date(),
      },
    });

    console.log(`Admin project creation notification sent to customer ${customerId} for project ${projectId}`);
  } catch (error) {
    console.error("Error creating admin project creation notification:", error);
  }
}

/**
 * Send notifications to all ADMIN users (contractors) when a CLIENT requests help
 */
export async function notifyAdminsHelpRequest(
  clientId: string,
  clientName: string,
  clientEmail: string,
  message?: string
) {
  try {
    // Get all active ADMIN users (contractors)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isDisabled: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (adminUsers.length === 0) {
      console.warn("No contractors found to notify about help request");
      return;
    }

    // Create notifications for all admin users
    await Promise.all(
      adminUsers.map((admin) =>
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: admin.id,
            type: "HELP_REQUEST",
            title: "Client Needs Help",
            message: `${clientName} (${clientEmail}) needs assistance with creating a project${message ? `: "${message}"` : ""}`,
            projectId: null,
            projectName: null,
            actionUrl: `/dashboard?tab=create-customer-project&clientId=${clientId}`,
            read: false,
            created_at: new Date(),
          },
        })
      )
    );

    console.log(`Help request notifications sent to ${adminUsers.length} contractors for client ${clientId}`);
  } catch (error) {
    console.error("Error creating help request notifications:", error);
  }
}