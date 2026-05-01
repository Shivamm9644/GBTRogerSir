<?php
include_once __DIR__ . '/backend/config/database.php';
$database = new Database();
$db = $database->getConnection();
$stmt = $db->query("SELECT id, company, app_version, platform, artifact_status FROM apps");
$apps = $stmt->fetchAll();

echo "--- App List ---\n";
foreach ($apps as $app) {
    echo "ID: {$app['id']} | Company: {$app['company']} | Version: {$app['app_version']} | Platform: {$app['platform']} | Status: {$app['artifact_status']}\n";
}
echo "--- End ---\n";
