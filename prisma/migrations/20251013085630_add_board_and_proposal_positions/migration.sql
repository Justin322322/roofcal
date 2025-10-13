-- AlterTable: add Kanban and proposal ordering columns to project
ALTER TABLE `project`
  ADD COLUMN `boardPosition` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `proposalPosition` INTEGER NOT NULL DEFAULT 0;


