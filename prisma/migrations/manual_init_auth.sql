-- Raw MySQL migration for initial auth schema (optional if using Prisma Migrate)
CREATE TABLE IF NOT EXISTS `User` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `role` varchar(64) NOT NULL DEFAULT 'client',
  `email_verified` datetime NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
