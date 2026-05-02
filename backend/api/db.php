<?php
$host = '127.0.0.1';
$db   = 'gbt_dashboard';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $conn = new mysqli($host, $user, $pass, $db);
    $conn->set_charset($charset);

    // 1. Ensure 'apps' table exists
    $conn->query("CREATE TABLE IF NOT EXISTS apps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company VARCHAR(255) DEFAULT 'Manual Archive',
        binary_file_name VARCHAR(255) NOT NULL,
        binary_file_ext VARCHAR(50) NOT NULL,
        parent_id INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Ensure parent_id exists
    $res = $conn->query("SHOW COLUMNS FROM apps LIKE 'parent_id'");
    if ($res->num_rows == 0) {
        $conn->query("ALTER TABLE apps ADD COLUMN parent_id INT DEFAULT 0");
    }

    // 3. Sync records from app_artifacts to apps if they are missing
    $checkOld = $conn->query("SHOW TABLES LIKE 'app_artifacts'");
    if ($checkOld->num_rows > 0) {
        $conn->query("INSERT INTO apps (id, company, binary_file_name, binary_file_ext, parent_id, created_at) 
                      SELECT id, company, binary_file_name, binary_file_ext, COALESCE(folder_id, 0), created_at 
                      FROM app_artifacts
                      WHERE id NOT IN (SELECT id FROM apps)");
    }

} catch (mysqli_sql_exception $e) {
     http_response_code(500);
     echo json_encode(["success" => false, "message" => "Database connection failed: " . $e->getMessage()]);
     exit;
}
