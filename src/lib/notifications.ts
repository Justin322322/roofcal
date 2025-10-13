import { sendEmail } from "@/lib/email";
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
    
    // Send email notification
    await sendEmail({
      to: notification.toUserEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // Create in-app notification in database
    await prisma.notification.create({
      data: {
        userId: notification.toUserId,
        type: notification.type,
        title: emailContent.subject,
        message: generateInAppMessage(notification),
        projectId: notification.projectId,
        projectName: notification.projectName,
        actionUrl: `/dashboard/project-management`,
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
      return `New project "${notification.projectName}" assigned by ${notification.fromUserName}`;
    default:
      return `Update for project "${notification.projectName}"`;
  }
}

function generateEmailContent(notification: NotificationData) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const projectUrl = `${baseUrl}/dashboard/project-management`;
  
  switch (notification.type) {
    case "status_change":
      return {
        subject: `Project Status Updated: ${notification.projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Project Status Update</h2>
            <p>Hello ${notification.toUserName},</p>
            <p>The status of your project <strong>"${notification.projectName}"</strong> has been updated to <strong>${notification.status}</strong>.</p>
            <p>Updated by: ${notification.fromUserName}</p>
            <div style="margin: 20px 0;">
              <a href="${projectUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact your contractor.
            </p>
          </div>
        `,
        text: `Project Status Update\n\nHello ${notification.toUserName},\n\nThe status of your project "${notification.projectName}" has been updated to ${notification.status}.\n\nUpdated by: ${notification.fromUserName}\n\nView project: ${projectUrl}\n\nIf you have any questions, please contact your contractor.`
      };

    case "proposal_sent":
      return {
        subject: `New Proposal Received: ${notification.projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Proposal Received</h2>
            <p>Hello ${notification.toUserName},</p>
            <p>You have received a new proposal for your project <strong>"${notification.projectName}"</strong> from ${notification.fromUserName}.</p>
            <p>Please review the proposal and accept or reject it at your earliest convenience.</p>
            <div style="margin: 20px 0;">
              <a href="${projectUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Proposal</a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This proposal will remain valid for 30 days.
            </p>
          </div>
        `,
        text: `New Proposal Received\n\nHello ${notification.toUserName},\n\nYou have received a new proposal for your project "${notification.projectName}" from ${notification.fromUserName}.\n\nPlease review the proposal and accept or reject it at your earliest convenience.\n\nReview proposal: ${projectUrl}\n\nThis proposal will remain valid for 30 days.`
      };

    case "proposal_accepted":
      return {
        subject: `Proposal Accepted: ${notification.projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Proposal Accepted</h2>
            <p>Hello ${notification.toUserName},</p>
            <p>Great news! Your proposal for the project <strong>"${notification.projectName}"</strong> has been accepted by ${notification.fromUserName}.</p>
            <p>The project is now ready to begin. Please contact the client to schedule the start date.</p>
            <div style="margin: 20px 0;">
              <a href="${projectUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Congratulations on securing this project!
            </p>
          </div>
        `,
        text: `Proposal Accepted\n\nHello ${notification.toUserName},\n\nGreat news! Your proposal for the project "${notification.projectName}" has been accepted by ${notification.fromUserName}.\n\nThe project is now ready to begin. Please contact the client to schedule the start date.\n\nView project: ${projectUrl}\n\nCongratulations on securing this project!`
      };

    case "proposal_rejected":
      return {
        subject: `Proposal Update: ${notification.projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Proposal Update</h2>
            <p>Hello ${notification.toUserName},</p>
            <p>Your proposal for the project <strong>"${notification.projectName}"</strong> was not accepted by ${notification.fromUserName}.</p>
            <p>You can review the project details and consider revising your proposal if needed.</p>
            <div style="margin: 20px 0;">
              <a href="${projectUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Feel free to contact the client for feedback or clarification.
            </p>
          </div>
        `,
        text: `Proposal Update\n\nHello ${notification.toUserName},\n\nYour proposal for the project "${notification.projectName}" was not accepted by ${notification.fromUserName}.\n\nYou can review the project details and consider revising your proposal if needed.\n\nView project: ${projectUrl}\n\nFeel free to contact the client for feedback or clarification.`
      };

    case "project_assigned":
      return {
        subject: `New Project Assignment: ${notification.projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">New Project Assignment</h2>
            <p>Hello ${notification.toUserName},</p>
            <p>You have been assigned a new project <strong>"${notification.projectName}"</strong> by ${notification.fromUserName}.</p>
            <p>Please review the project details and prepare a proposal for the client.</p>
            <div style="margin: 20px 0;">
              <a href="${projectUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Project</a>
            </div>
            <p style="color: #666; font-size: 14px;">
              You can access the project details in your contractor dashboard to begin your review.
            </p>
          </div>
        `,
        text: `New Project Assignment\n\nHello ${notification.toUserName},\n\nYou have been assigned a new project "${notification.projectName}" by ${notification.fromUserName}.\n\nPlease review the project details and prepare a proposal for the client.\n\nReview project: ${projectUrl}\n\nYou can access the project details in your contractor dashboard to begin your review.`
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