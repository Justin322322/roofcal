/*
  Warnings:

  - You are about to drop the column `disabled` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `disabledAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `disabledBy` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `disabled`,
    DROP COLUMN `disabledAt`,
    DROP COLUMN `disabledBy`,
    ADD COLUMN `isDisabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `User_isDisabled_idx` ON `user`(`isDisabled`);
