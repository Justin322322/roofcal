import { sendCustomEmail, type EmailTemplateData } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export interface NotificationData {
  type: "status_change" | "proposal_sent" | "proposal_accepted" | "proposal_rejected" | "project_assigned";
  projectId: string;
  projectName: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  toUserEmail: string;
  status?: string;
  message?: string;
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
        userId: notification.toUserId,
        type: notification.type,
        title: emailContent.subject,
        message: generateInAppMessage(notification),
        projectId: notification.projectId,
        projectName: notification.projectName,
        actionUrl: `/dashboard?tab=proposals`,
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
  const projectUrl = `${baseUrl}/dashboard?tab=proposals`;
  
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