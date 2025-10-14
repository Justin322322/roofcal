-- AlterTable
ALTER TABLE `user` ADD COLUMN `disabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `disabledAt` DATETIME(3) NULL,
    ADD COLUMN `disabledBy` VARCHAR(191) NULL;
