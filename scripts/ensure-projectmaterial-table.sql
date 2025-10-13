-- Ensure ProjectMaterial table exists
-- This script can be run manually on Railway database if migration didn't run

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS `ProjectMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `warehouseMaterialId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('RESERVED', 'CONSUMED', 'RETURNED', 'CANCELLED') NOT NULL DEFAULT 'RESERVED',
    `reservedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `consumedAt` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,
    `notes` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProjectMaterial_projectId_idx`(`projectId`),
    INDEX `ProjectMaterial_warehouseMaterialId_idx`(`warehouseMaterialId`),
    INDEX `ProjectMaterial_status_idx`(`status`),
    INDEX `ProjectMaterial_consumedAt_idx`(`consumedAt`),
    UNIQUE INDEX `ProjectMaterial_projectId_warehouseMaterialId_key`(`projectId`, `warehouseMaterialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign keys if they don't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
               WHERE CONSTRAINT_NAME = 'ProjectMaterial_projectId_fkey' 
               AND TABLE_SCHEMA = DATABASE());
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ProjectMaterial` ADD CONSTRAINT `ProjectMaterial_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;',
    'SELECT "Foreign key ProjectMaterial_projectId_fkey already exists" as message;');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
               WHERE CONSTRAINT_NAME = 'ProjectMaterial_warehouseMaterialId_fkey' 
               AND TABLE_SCHEMA = DATABASE());
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ProjectMaterial` ADD CONSTRAINT `ProjectMaterial_warehouseMaterialId_fkey` FOREIGN KEY (`warehouseMaterialId`) REFERENCES `WarehouseMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;',
    'SELECT "Foreign key ProjectMaterial_warehouseMaterialId_fkey already exists" as message;');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

