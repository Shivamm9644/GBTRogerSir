-- ============================================================
-- GBT Dashboard – Database Setup
-- Run this file in your MySQL client or phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS `gbt_dashboard`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gbt_dashboard`;

-- Companies table
CREATE TABLE IF NOT EXISTS `companies` (
  `id`           INT(11)      NOT NULL AUTO_INCREMENT,
  `company_name` VARCHAR(255) NOT NULL,
  `package_name` VARCHAR(255) DEFAULT NULL,
  `owner_name`   VARCHAR(255) NOT NULL,
  `owner_mobile` VARCHAR(20)  NOT NULL,
  `owner_email`  VARCHAR(255) NOT NULL,
  `address`      TEXT         DEFAULT NULL,
  `admin_url`    VARCHAR(500) NOT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_url` (`admin_url`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Apps Artifacts table
CREATE TABLE IF NOT EXISTS `app_artifacts` (
  `id`                    INT(11)      NOT NULL AUTO_INCREMENT,
  `company`               VARCHAR(255) NOT NULL,
  `description`           TEXT         DEFAULT NULL,
  `app_type`              VARCHAR(100) DEFAULT NULL,
  `platform`              VARCHAR(50)  DEFAULT NULL,
  `app_version`           VARCHAR(50)  DEFAULT NULL,
  `os_version`            VARCHAR(50)  DEFAULT NULL,
  `hardware`              VARCHAR(100) DEFAULT NULL,
  `firmware_version`      VARCHAR(100) DEFAULT NULL,
  `effective_date`        VARCHAR(100) DEFAULT NULL,
  `artifact_status`       VARCHAR(50)  DEFAULT 'Stable',
  `binary_file_name`      VARCHAR(255) DEFAULT NULL,
  `binary_file_path`      VARCHAR(500) DEFAULT NULL,
  `binary_file_ext`       VARCHAR(10)  DEFAULT NULL,
  `is_latest`             TINYINT(1)   DEFAULT 1,
  `archive_status`        VARCHAR(50)  DEFAULT 'active',
  `is_encrypted`          TINYINT(1)   DEFAULT 0,
  `is_locked`             TINYINT(1)   DEFAULT 0,
  `dot_cancelled`         TINYINT(1)   DEFAULT 0,
  `trigger_login_update`  TINYINT(1)   DEFAULT 0,
  `store_upload_status`   VARCHAR(50)  DEFAULT 'pending',
  `store_upload_message`  TEXT         DEFAULT NULL,
  `uploaded_to_store_at`  TIMESTAMP    NULL DEFAULT NULL,
  `created_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `archived_at`           TIMESTAMP    NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
