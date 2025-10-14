-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('CLIENT', 'ADMIN', 'DEVELOPER') NOT NULL DEFAULT 'CLIENT';

-- CreateTable
CREATE TABLE `systemsettings` (
    `id` VARCHAR(191) NOT NULL,
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `maintenanceMessage` TEXT NULL,
    `maintenanceScheduledEnd` DATETIME(3) NULL,
    `maintenanceStartedBy` VARCHAR(191) NULL,
    `maintenanceStartedAt` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SystemSettings_maintenanceMode_idx`(`maintenanceMode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
