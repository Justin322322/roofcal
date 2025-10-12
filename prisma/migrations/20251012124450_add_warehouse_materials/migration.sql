-- CreateTable
CREATE TABLE `WarehouseMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `locationAdjustment` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `WarehouseMaterial_warehouseId_idx`(`warehouseId`),
    INDEX `WarehouseMaterial_materialId_idx`(`materialId`),
    INDEX `WarehouseMaterial_isActive_idx`(`isActive`),
    UNIQUE INDEX `WarehouseMaterial_warehouseId_materialId_key`(`warehouseId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WarehouseMaterial` ADD CONSTRAINT `WarehouseMaterial_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarehouseMaterial` ADD CONSTRAINT `WarehouseMaterial_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `PricingConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
