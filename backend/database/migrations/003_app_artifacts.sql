-- ============================================================
-- GBT Dashboard - App Artifacts Table
-- ============================================================

USE `gbt_dashboard`;

CREATE TABLE IF NOT EXISTS `app_artifacts` (
  `id`                   INT(11)      NOT NULL AUTO_INCREMENT,
  `company`              VARCHAR(255) NOT NULL,
  `description`          TEXT         DEFAULT NULL,
  `app_type`             VARCHAR(100) NOT NULL,
  `app_version`          VARCHAR(100) NOT NULL,
  `os_version`           VARCHAR(100) DEFAULT NULL,
  `platform`             VARCHAR(50)  NOT NULL,
  `user_manual`          VARCHAR(255) DEFAULT NULL,
  `effective_date`       VARCHAR(50)  DEFAULT NULL,
  `hardware`             VARCHAR(100) DEFAULT NULL,
  `firmware_version`     VARCHAR(100) DEFAULT NULL,
  `fw_effective_date`    VARCHAR(50)  DEFAULT NULL,
  `is_locked`            TINYINT(1)   DEFAULT 0,
  `artifact_status`      VARCHAR(50)  DEFAULT 'Stable',
  `dot_cancelled`        TINYINT(1)   DEFAULT 0,
  `trigger_login_update` TINYINT(1)   DEFAULT 0,
  `binary_file_name`     VARCHAR(255) DEFAULT NULL,
  `binary_file_path`     VARCHAR(255) DEFAULT NULL,
  `binary_file_ext`      VARCHAR(10)  DEFAULT NULL,
  `is_latest`            TINYINT(1)   DEFAULT 1,
  `archive_status`       VARCHAR(50)  DEFAULT 'active',
  `archived_at`          TIMESTAMP    NULL DEFAULT NULL,
  `is_encrypted`         TINYINT(1)   DEFAULT 0,
  `store_upload_status`  VARCHAR(50)  DEFAULT 'none',
  `store_upload_message` TEXT         DEFAULT NULL,
  `uploaded_to_store_at` TIMESTAMP    NULL DEFAULT NULL,
  `mail_sent_at`         TIMESTAMP    NULL DEFAULT NULL,
  `created_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
