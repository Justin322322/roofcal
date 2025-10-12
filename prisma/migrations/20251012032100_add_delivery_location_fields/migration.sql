-- AlterTable
ALTER TABLE `project` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `assignedAt` DATETIME(3) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `clientId` VARCHAR(191) NULL,
    ADD COLUMN `contractorId` VARCHAR(191) NULL,
    ADD COLUMN `deliveryCost` DECIMAL(12, 2) NULL,
    ADD COLUMN `deliveryDistance` DECIMAL(8, 2) NULL,
    ADD COLUMN `latitude` DECIMAL(10, 8) NULL,
    ADD COLUMN `longitude` DECIMAL(11, 8) NULL,
    ADD COLUMN `proposalSent` DATETIME(3) NULL,
    ADD COLUMN `proposalStatus` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'REVISED') NULL DEFAULT 'DRAFT',
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `warehouseId` VARCHAR(191) NULL,
    ADD COLUMN `zipCode` VARCHAR(191) NULL,
    MODIFY `status` ENUM('DRAFT', 'ACTIVE', 'CLIENT_PENDING', 'CONTRACTOR_REVIEWING', 'PROPOSAL_SENT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `warehouse` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `zipCode` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Warehouse_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Project_contractorId_idx` ON `project`(`contractorId`);

-- CreateIndex
CREATE INDEX `Project_clientId_idx` ON `project`(`clientId`);

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse` ADD CONSTRAINT `warehouse_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
