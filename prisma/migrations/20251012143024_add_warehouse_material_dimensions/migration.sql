-- AlterTable
ALTER TABLE `pricingconfig` ADD COLUMN `height` DECIMAL(8, 2) NULL,
    ADD COLUMN `length` DECIMAL(8, 2) NULL,
    ADD COLUMN `volume` DECIMAL(10, 4) NULL,
    ADD COLUMN `width` DECIMAL(8, 2) NULL;

-- AlterTable
ALTER TABLE `warehouse` ADD COLUMN `capacity` DECIMAL(12, 2) NULL,
    ADD COLUMN `height` DECIMAL(8, 2) NULL,
    ADD COLUMN `length` DECIMAL(8, 2) NULL,
    ADD COLUMN `width` DECIMAL(8, 2) NULL;
