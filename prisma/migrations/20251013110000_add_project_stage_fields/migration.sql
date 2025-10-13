-- Add simple single-page processing fields and enum for Project stages
-- MySQL migration

ALTER TABLE `project`
  ADD COLUMN `currentStage` ENUM('INSPECTION','ESTIMATE','MATERIALS','INSTALL','FINALIZE') NOT NULL DEFAULT 'INSPECTION',
  ADD COLUMN `stageProgress` JSON NULL,
  ADD COLUMN `sentToContractorAt` DATETIME NULL,
  ADD COLUMN `contractorStatus` VARCHAR(191) NULL,
  ADD COLUMN `handoffNote` LONGTEXT NULL;

-- Backfill defaults for existing rows
UPDATE `project`
SET `currentStage` = 'INSPECTION'
WHERE `currentStage` IS NULL;

UPDATE `project`
SET `stageProgress` = JSON_OBJECT(
  'INSPECTION', false,
  'ESTIMATE', false,
  'MATERIALS', false,
  'INSTALL', false,
  'FINALIZE', false
)
WHERE `stageProgress` IS NULL;


