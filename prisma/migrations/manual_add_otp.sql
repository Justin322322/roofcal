-- Add VerificationCode table for email verification and password reset
CREATE TABLE IF NOT EXISTS `VerificationCode` (
  `id` varchar(191) NOT NULL,
  `code` varchar(6) NOT NULL,
  `email` varchar(191) NOT NULL,
  `type` varchar(64) NOT NULL DEFAULT 'email_verification',
  `expiresAt` datetime NOT NULL,
  `used` boolean NOT NULL DEFAULT false,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `VerificationCode_email_idx` (`email`),
  KEY `VerificationCode_code_idx` (`code`),
  KEY `VerificationCode_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `VerificationCode_email_fkey` FOREIGN KEY (`email`) REFERENCES `User` (`email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
