-- ============================================================
-- GBT Dashboard - Admin Users Activity Logs Table
-- Run this in your MySQL / phpMyAdmin on the `gbt_dashboard` DB
-- ============================================================

CREATE TABLE IF NOT EXISTS `tbl_user_logs` (
    `id`             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`        INT UNSIGNED    NOT NULL,
    `user_email`     VARCHAR(150)    NOT NULL,
    `action`         VARCHAR(50)     NOT NULL,          -- e.g., 'LOGIN', 'LOGOUT'
    `action_time`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP, -- UTC stored time
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_user_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `tbl_admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
