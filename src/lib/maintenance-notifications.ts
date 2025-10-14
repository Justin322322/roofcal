import { prisma } from "@/lib/prisma";
import { sendCustomEmail, type EmailTemplateData } from "@/lib/email";
import { randomUUID } from "crypto";

export interface MaintenanceNotificationData {
  maintenanceMode: boolean;
  message?: string;
  scheduledEnd?: Date | null;
  startedBy: string;
  startedAt: Date;
}

/**
 * Get all active users (not disabled) for maintenance notifications
 */
async function getAllActiveUsers() {
  return await prisma.user.findMany({
    where: {
      isDisabled: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });
}

/**
 * Generate email content for maintenance notifications
 */
function generateMaintenanceEmailContent(
  notification: MaintenanceNotificationData,
  userFirstName: string
): { subject: string; templateData: EmailTemplateData; text: string } {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const isMaintenanceStarting = notification.maintenanceMode;
  
  const subject = isMaintenanceStarting 
    ? "Scheduled Maintenance - RoofCal" 
    : "Maintenance Complete - RoofCal";
  
  const heading = isMaintenanceStarting 
    ? "Scheduled System Maintenance" 
    : "Maintenance Complete - System Online";
  
  const content = isMaintenanceStarting
    ? `Hello ${userFirstName},<br/><br/>We wanted to inform you that our development team has scheduled system maintenance for RoofCal. During this time, you may experience temporary service interruptions or limited functionality.<br/><br/>${notification.message ? `<strong>Additional Details:</strong> ${notification.message}<br/><br/>` : ''}${notification.scheduledEnd ? `We expect the maintenance to be completed by <strong>${notification.scheduledEnd.toLocaleString()}</strong>.<br/><br/>` : ''}We apologize for any inconvenience this may cause and appreciate your patience.`
    : `Hello ${userFirstName},<br/><br/>Great news! The scheduled maintenance for RoofCal has been completed successfully. All services are now fully operational and you should be able to access all features without any issues.<br/><br/>Thank you for your patience during the maintenance window. If you experience any problems, please don't hesitate to contact support.`;
  
  const text = isMaintenanceStarting
    ? `Scheduled System Maintenance\n\nHello ${userFirstName},\n\nWe wanted to inform you that our development team has scheduled system maintenance for RoofCal. During this time, you may experience temporary service interruptions or limited functionality.\n\n${notification.message ? `Additional Details: ${notification.message}\n\n` : ''}${notification.scheduledEnd ? `We expect the maintenance to be completed by ${notification.scheduledEnd.toLocaleString()}.\n\n` : ''}We apologize for any inconvenience this may cause and appreciate your patience.`
    : `Maintenance Complete - System Online\n\nHello ${userFirstName},\n\nGreat news! The scheduled maintenance for RoofCal has been completed successfully. All services are now fully operational and you should be able to access all features without any issues.\n\nThank you for your patience during the maintenance window. If you experience any problems, please don't hesitate to contact support.`;

  return {
    subject,
    templateData: {
      title: subject,
      heading,
      content,
      actionContent: `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            ${isMaintenanceStarting ? 'Check System Status' : 'Access RoofCal'}
          </a>
        </div>
      `,
      securityNotice: isMaintenanceStarting 
        ? "This is an automated maintenance notification. No action is required from you."
        : "If you experience any issues after maintenance, please contact support immediately.",
    },
    text,
  };
}

/**
 * Send maintenance notification to all active users
 */
export async function sendMaintenanceNotification(
  notification: MaintenanceNotificationData
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  try {
    console.log(`Starting maintenance notification process for ${notification.maintenanceMode ? 'maintenance start' : 'maintenance end'}`);
    
    // Get all active users
    const users = await getAllActiveUsers();
    
    if (users.length === 0) {
      console.log("No active users found for maintenance notification");
      return { success: true, sentCount: 0, errors: [] };
    }

    console.log(`Found ${users.length} active users to notify`);

    const errors: string[] = [];
    let sentCount = 0;

    // Send notifications to all users
    const notificationPromises = users.map(async (user) => {
      try {
        const emailContent = generateMaintenanceEmailContent(
          notification,
          user.firstName
        );

        // Send email notification
        const emailResult = await sendCustomEmail(
          user.email,
          emailContent.subject,
          emailContent.templateData,
          emailContent.text
        );

        if (!emailResult.success) {
          throw new Error(emailResult.error || "Failed to send email");
        }

        // Create in-app notification
        await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            type: notification.maintenanceMode ? "maintenance_start" : "maintenance_end",
            title: emailContent.subject,
            message: emailContent.text.replace(/\n/g, " ").substring(0, 200) + "...",
            actionUrl: "/dashboard",
          },
        });

        sentCount++;
        console.log(`Maintenance notification sent to ${user.email}`);
      } catch (error) {
        const errorMessage = `Failed to notify ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    });

    // Wait for all notifications to complete
    await Promise.all(notificationPromises);

    console.log(`Maintenance notification process completed. Sent: ${sentCount}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      sentCount,
      errors,
    };
  } catch (error) {
    const errorMessage = `Failed to send maintenance notifications: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage);
    return {
      success: false,
      sentCount: 0,
      errors: [errorMessage],
    };
  }
}

/**
 * Get the developer user who started maintenance
 */
export async function getMaintenanceInitiator(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to get maintenance initiator:", error);
    return null;
  }
}
