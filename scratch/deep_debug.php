<?php
$db_config = [
    'host' => '127.0.0.1',
    'db' => 'gbt_dashboard',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
];
$dsn = "mysql:host={$db_config['host']};dbname={$db_config['db']};charset={$db_config['charset']}";
try {
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass']);
    
    echo "--- ALL ARTIFACTS ---\n";
    $stmt = $pdo->query("SELECT id, company, app_version, platform, is_latest, archive_status, created_at FROM app_artifacts ORDER BY created_at DESC");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']} | Co: {$row['company']} | Ver: {$row['app_version']} | Plat: {$row['platform']} | Latest: {$row['is_latest']} | Status: {$row['archive_status']} | Created: {$row['created_at']}\n";
    }
    
    echo "\n--- COMPANIES ---\n";
    $stmt = $pdo->query("SELECT company_name, package_name FROM companies");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Company: {$row['company_name']} | Package: {$row['package_name']}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
