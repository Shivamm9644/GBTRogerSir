<?php
require_once 'db.php';

// 1. Create 'apps' table if it doesn't exist
$sql = "CREATE TABLE IF NOT EXISTS apps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(255) DEFAULT 'Manual Archive',
    binary_file_name VARCHAR(255) NOT NULL,
    binary_file_ext VARCHAR(50) NOT NULL,
    parent_id INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($sql)) {
    echo "Success: 'apps' table ready.\n";
    
    // 2. Check if 'app_artifacts' exists and migrate data if 'apps' is empty
    $check = $conn->query("SHOW TABLES LIKE 'app_artifacts'");
    if ($check->num_rows > 0) {
        $count = $conn->query("SELECT COUNT(*) FROM apps")->fetch_row()[0];
        if ($count == 0) {
            // Check columns in app_artifacts to map them
            $conn->query("INSERT INTO apps (company, binary_file_name, binary_file_ext, parent_id, created_at) 
                          SELECT company, binary_file_name, binary_file_ext, COALESCE(folder_id, 0), created_at 
                          FROM app_artifacts");
            echo "Success: Data migrated from 'app_artifacts' to 'apps'.\n";
        }
    }
    
    // 3. Ensure parent_id column exists (just in case)
    $conn->query("ALTER TABLE apps ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT 0");
} else {
    echo "Error: " . $conn->error;
}
