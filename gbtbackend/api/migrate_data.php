<?php
require_once 'db.php';

echo "Checking for data migration...\n";

// Check if app_artifacts exists
$check = $conn->query("SHOW TABLES LIKE 'app_artifacts'");
if ($check->num_rows > 0) {
    // Check if apps is empty or if we should sync
    $appCount = $conn->query("SELECT COUNT(*) FROM apps")->fetch_row()[0];
    
    // We only migrate if apps is empty to avoid duplicates
    if ($appCount == 0) {
        $sql = "INSERT INTO apps (id, company, binary_file_name, binary_file_ext, parent_id, created_at) 
                SELECT id, company, binary_file_name, binary_file_ext, COALESCE(folder_id, 0), created_at 
                FROM app_artifacts";
        
        if ($conn->query($sql)) {
            echo "Success: Migrated data from 'app_artifacts' to 'apps'.\n";
        } else {
            echo "Error during migration: " . $conn->error . "\n";
        }
    } else {
        echo "Table 'apps' already has data. Skipping migration.\n";
    }
} else {
    echo "Source table 'app_artifacts' not found.\n";
}
?>
