-- AlterTable
ALTER TABLE `pricingconfig` ADD COLUMN `height` DECIMAL(8, 2) NULL,
    ADD COLUMN `length` DECIMAL(8, 2) NULL,
    ADD COLUMN `volume` DECIMAL(10, 4) NULL,
    ADD COLUMN `width` DECIMAL(8, 2) NULL;

-- AlterTable
ALTER TABLE `project` ADD COLUMN `materialsConsumed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `materialsConsumedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `warehouse` ADD COLUMN `capacity` DECIMAL(12, 2) NULL,
    ADD COLUMN `height` DECIMAL(8, 2) NULL,
    ADD COLUMN `length` DECIMAL(8, 2) NULL,
    ADD COLUMN `width` DECIMAL(8, 2) NULL;

-- CreateTable
CREATE TABLE `ProjectMaterial` (
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

-- AddForeignKey
ALTER TABLE `ProjectMaterial` ADD CONSTRAINT `ProjectMaterial_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMaterial` ADD CONSTRAINT `ProjectMaterial_warehouseMaterialId_fkey` FOREIGN KEY (`warehouseMaterialId`) REFERENCES `WarehouseMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
