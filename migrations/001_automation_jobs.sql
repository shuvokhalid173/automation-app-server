CREATE TABLE IF NOT EXISTS `automation_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `trigger_type` enum('manual','scheduled') NOT NULL DEFAULT 'manual',
  `platform` varchar(50) NOT NULL DEFAULT 'all',
  `status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
  `files_processed` int NOT NULL DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_status_created` (`status`, `created_at`),
  KEY `idx_jobs_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
