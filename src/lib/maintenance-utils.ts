import { prisma } from "@/lib/prisma";
import { sendMaintenanceNotification, type MaintenanceNotificationData } from "./maintenance-notifications";

/**
 * Maintenance settings interface
 */
export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceScheduledEnd: Date | null;
  maintenanceStartedBy: string | null;
  maintenanceStartedAt: Date | null;
}

/**
 * Get the current maintenance status
 * Returns the first system settings record or creates one if none exists
 */
export async function getMaintenanceStatus(): Promise<MaintenanceSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings = await (prisma as any).systemsettings.findFirst();

  // If no settings exist, create default settings
  if (!settings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.create({
      data: {
        id: crypto.randomUUID(),
        maintenanceMode: false,
        maintenanceMessage: null,
        maintenanceScheduledEnd: null,
        maintenanceStartedBy: null,
        maintenanceStartedAt: null,
        updated_at: new Date(),
      },
    });
  }

  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceScheduledEnd: settings.maintenanceScheduledEnd,
    maintenanceStartedBy: settings.maintenanceStartedBy,
    maintenanceStartedAt: settings.maintenanceStartedAt,
  };
}

/**
 * Enable maintenance mode
 * @param userId - ID of the user enabling maintenance
 * @param message - Optional custom maintenance message
 * @param scheduledEnd - Optional scheduled end time
 */
export async function enableMaintenance(
  userId: string,
  message?: string,
  scheduledEnd?: Date
): Promise<MaintenanceSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings = await (prisma as any).systemsettings.findFirst();

  if (!settings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.create({
      data: {
        id: crypto.randomUUID(),
        maintenanceMode: true,
        maintenanceMessage: message || null,
        maintenanceScheduledEnd: scheduledEnd || null,
        maintenanceStartedBy: userId,
        maintenanceStartedAt: new Date(),
        updated_at: new Date(),
      },
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.update({
      where: { id: settings.id },
      data: {
        maintenanceMode: true,
        maintenanceMessage: message || null,
        maintenanceScheduledEnd: scheduledEnd || null,
        maintenanceStartedBy: userId,
        maintenanceStartedAt: new Date(),
      },
    });
  }

  // Send maintenance notification to all users
  try {
    const notificationData: MaintenanceNotificationData = {
      maintenanceMode: true,
      message,
      scheduledEnd,
      startedBy: userId,
      startedAt: settings.maintenanceStartedAt,
    };

    const notificationResult = await sendMaintenanceNotification(notificationData);
    
    if (notificationResult.success) {
      console.log(`Maintenance notification sent successfully to ${notificationResult.sentCount} users`);
    } else {
      console.error(`Maintenance notification had errors:`, notificationResult.errors);
    }
  } catch (error) {
    console.error("Failed to send maintenance notification:", error);
    // Don't fail the maintenance enable operation if notification fails
  }

  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceScheduledEnd: settings.maintenanceScheduledEnd,
    maintenanceStartedBy: settings.maintenanceStartedBy,
    maintenanceStartedAt: settings.maintenanceStartedAt,
  };
}

/**
 * Disable maintenance mode
 */
export async function disableMaintenance(): Promise<MaintenanceSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings = await (prisma as any).systemsettings.findFirst();

  // Store the previous maintenance info for notification
  const previousMaintenanceStartedBy = settings?.maintenanceStartedBy;
  const previousMaintenanceStartedAt = settings?.maintenanceStartedAt;

  if (!settings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.create({
      data: {
        id: crypto.randomUUID(),
        maintenanceMode: false,
        maintenanceMessage: null,
        maintenanceScheduledEnd: null,
        maintenanceStartedBy: null,
        maintenanceStartedAt: null,
        updated_at: new Date(),
      },
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.update({
      where: { id: settings.id },
      data: {
        maintenanceMode: false,
        maintenanceMessage: null,
        maintenanceScheduledEnd: null,
        maintenanceStartedBy: null,
        maintenanceStartedAt: null,
      },
    });
  }

  // Send maintenance completion notification to all users
  if (previousMaintenanceStartedBy && previousMaintenanceStartedAt) {
    try {
      const notificationData: MaintenanceNotificationData = {
        maintenanceMode: false,
        startedBy: previousMaintenanceStartedBy,
        startedAt: previousMaintenanceStartedAt,
      };

      const notificationResult = await sendMaintenanceNotification(notificationData);
      
      if (notificationResult.success) {
        console.log(`Maintenance completion notification sent successfully to ${notificationResult.sentCount} users`);
      } else {
        console.error(`Maintenance completion notification had errors:`, notificationResult.errors);
      }
    } catch (error) {
      console.error("Failed to send maintenance completion notification:", error);
      // Don't fail the maintenance disable operation if notification fails
    }
  }

  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceScheduledEnd: settings.maintenanceScheduledEnd,
    maintenanceStartedBy: settings.maintenanceStartedBy,
    maintenanceStartedAt: settings.maintenanceStartedAt,
  };
}

/**
 * Update maintenance settings
 * @param userId - ID of the user updating maintenance
 * @param maintenanceMode - Maintenance mode status
 * @param message - Optional custom maintenance message
 * @param scheduledEnd - Optional scheduled end time
 */
export async function updateMaintenanceSettings(
  userId: string,
  maintenanceMode: boolean,
  message?: string,
  scheduledEnd?: Date
): Promise<MaintenanceSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings = await (prisma as any).systemsettings.findFirst();

  // Store the previous maintenance info for notification
  const previousMaintenanceMode = settings?.maintenanceMode;
  const previousMaintenanceStartedAt = settings?.maintenanceStartedAt;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    maintenanceMode,
    maintenanceMessage: message || null,
    maintenanceScheduledEnd: scheduledEnd || null,
  };

  // Only update started info if enabling maintenance
  if (maintenanceMode) {
    data.maintenanceStartedBy = userId;
    data.maintenanceStartedAt = new Date();
  } else {
    data.maintenanceStartedBy = null;
    data.maintenanceStartedAt = null;
  }

  if (!settings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        updated_at: new Date(),
      },
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma as any).systemsettings.update({
      where: { id: settings.id },
      data,
    });
  }

  // Send maintenance notifications if status changed
  if (previousMaintenanceMode !== maintenanceMode) {
    try {
      const notificationData: MaintenanceNotificationData = {
        maintenanceMode,
        message,
        scheduledEnd,
        startedBy: userId,
        startedAt: maintenanceMode ? settings.maintenanceStartedAt : previousMaintenanceStartedAt || new Date(),
      };

      const notificationResult = await sendMaintenanceNotification(notificationData);
      
      if (notificationResult.success) {
        console.log(`Maintenance ${maintenanceMode ? 'start' : 'end'} notification sent successfully to ${notificationResult.sentCount} users`);
      } else {
        console.error(`Maintenance notification had errors:`, notificationResult.errors);
      }
    } catch (error) {
      console.error("Failed to send maintenance notification:", error);
      // Don't fail the maintenance update operation if notification fails
    }
  }

  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceScheduledEnd: settings.maintenanceScheduledEnd,
    maintenanceStartedBy: settings.maintenanceStartedBy,
    maintenanceStartedAt: settings.maintenanceStartedAt,
  };
}

/**
 * Get maintenance settings (alias for getMaintenanceStatus)
 */
export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  return getMaintenanceStatus();
}

