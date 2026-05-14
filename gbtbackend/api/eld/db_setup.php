<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // company_api_configs
    $db->exec("CREATE TABLE IF NOT EXISTS company_api_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_key VARCHAR(100) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        base_url VARCHAR(255),
        driver_endpoint VARCHAR(255),
        vehicle_endpoint VARCHAR(255),
        client_endpoint VARCHAR(255),
        server_health_endpoint VARCHAR(255),
        auth_type VARCHAR(50) DEFAULT 'none',
        token TEXT,
        username VARCHAR(255),
        password VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // eld_company_summary
    $db->exec("CREATE TABLE IF NOT EXISTS eld_company_summary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_key VARCHAR(100) UNIQUE NOT NULL,
        total_drivers INT DEFAULT 0,
        active_vehicles INT DEFAULT 0,
        total_clients INT DEFAULT 0,
        server_status VARCHAR(50) DEFAULT 'offline',
        raw_driver_response LONGTEXT,
        raw_vehicle_response LONGTEXT,
        raw_client_response LONGTEXT,
        raw_health_response LONGTEXT,
        last_sync DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // eld_sync_logs
    $db->exec("CREATE TABLE IF NOT EXISTS eld_sync_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_key VARCHAR(100),
        api_name VARCHAR(100),
        api_url VARCHAR(255),
        status VARCHAR(50),
        response_code INT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Seed configs
    $seeds = [
        [
            'truckertrace', 'TruckerTrace', 'https://admin.truckertraceeld.com',
            '/eld_log/master/view_driver_information', '/eld_log/master/view_active_vehicle',
            '/eld_log/master/view_client', '/eld_log/dispatch/view_server_health'
        ],
        [
            'allstar', 'AllStar', 'https://admin.allstarelogs.com',
            '/eld_log/master/view_driver_information', '/eld_log/master/view_active_vehicle',
            '/eld_log/master/view_client', '/eld_log/dispatch/view_server_health'
        ],
        [
            'semield', 'Semi ELD', 'https://samield.com',
            '/eld_log/master/view_driver_information', '/eld_log/master/view_active_vehicle',
            '/eld_log/master/view_client', '/eld_log/dispatch/view_server_health'
        ]
    ];

    $stmt = $db->prepare("INSERT INTO company_api_configs (company_key, company_name, base_url, driver_endpoint, vehicle_endpoint, client_endpoint, server_health_endpoint) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE base_url = VALUES(base_url), driver_endpoint = VALUES(driver_endpoint), vehicle_endpoint = VALUES(vehicle_endpoint), client_endpoint = VALUES(client_endpoint), server_health_endpoint = VALUES(server_health_endpoint)");

    foreach ($seeds as $s) {
        $stmt->execute($s);
    }

    // Also seed empty summary rows so they exist
    $stmt2 = $db->prepare("INSERT IGNORE INTO eld_company_summary (company_key) VALUES (?)");
    foreach ($seeds as $s) {
        $stmt2->execute([$s[0]]);
    }

    // echo "Database tables and seed data setup successfully.";
} catch (Exception $e) {
    // echo "Error: " . $e->getMessage();
}
