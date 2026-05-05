-- ============================================================
-- GBT Dashboard - Admin Users Table
-- Run this in your MySQL / phpMyAdmin on the `gbt_dashboard` DB
-- ============================================================

CREATE TABLE IF NOT EXISTS `tbl_admin_users` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `name`          VARCHAR(100)    NOT NULL,
    `email`         VARCHAR(150)    NOT NULL UNIQUE,
    `password_hash` VARCHAR(255)    NOT NULL,          -- bcrypt hash
    `role`          VARCHAR(50)     NOT NULL DEFAULT 'Admin',
    `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
    `last_login`    DATETIME                 DEFAULT NULL,
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Seed: default admin user
--   email   : admin@gbt.com
--   password: admin123   (bcrypt hash below)
-- ============================================================
INSERT INTO `tbl_admin_users` (`name`, `email`, `password_hash`, `role`)
VALUES (
    'GBT Admin',
    'admin@gbt.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- "password" demo hash; replace after first login
    'System Admin'
);

-- ============================================================
-- To add more users, run (replace values as needed):
-- INSERT INTO tbl_admin_users (name, email, password_hash, role)
-- VALUES ('Jane Doe', 'jane@gbt.com', '<bcrypt_hash>', 'Admin');
-- ============================================================
