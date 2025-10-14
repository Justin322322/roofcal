import { prisma } from "@/lib/prisma";

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
  let settings = await prisma.systemsettings.findFirst();

  // If no settings exist, create default settings
  if (!settings) {
    settings = await prisma.systemsettings.create({
      data: {
        maintenanceMode: false,
        maintenanceMessage: null,
        maintenanceScheduledEnd: null,
        maintenanceStartedBy: null,
        maintenanceStartedAt: null,
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
  let settings = await prisma.systemsettings.findFirst();

  if (!settings) {
    settings = await prisma.systemsettings.create({
      data: {
        maintenanceMode: true,
        maintenanceMessage: message || null,
        maintenanceScheduledEnd: scheduledEnd || null,
        maintenanceStartedBy: userId,
        maintenanceStartedAt: new Date(),
      },
    });
  } else {
    settings = await prisma.systemsettings.update({
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
  let settings = await prisma.systemsettings.findFirst();

  if (!settings) {
    settings = await prisma.systemsettings.create({
      data: {
        maintenanceMode: false,
        maintenanceMessage: null,
        maintenanceScheduledEnd: null,
        maintenanceStartedBy: null,
        maintenanceStartedAt: null,
      },
    });
  } else {
    settings = await prisma.systemsettings.update({
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
  let settings = await prisma.systemsettings.findFirst();

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
    settings = await prisma.systemsettings.create({
      data,
    });
  } else {
    settings = await prisma.systemsettings.update({
      where: { id: settings.id },
      data,
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
 * Get maintenance settings (alias for getMaintenanceStatus)
 */
export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  return getMaintenanceStatus();
}

