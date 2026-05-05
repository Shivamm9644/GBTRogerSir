<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$results = [];

// 1. Check PHP settings
$results['php_settings'] = [
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'temp_dir' => ini_get('upload_tmp_dir') ?: sys_get_temp_dir()
];

// 2. Check storage directory
$uploadDir = __DIR__ . '/../storage/apps/';
$results['storage'] = [
    'path' => realpath($uploadDir) ?: $uploadDir,
    'exists' => is_dir($uploadDir),
    'writable' => is_writable($uploadDir)
];

if (!$results['storage']['exists']) {
    $results['storage']['created'] = mkdir($uploadDir, 0777, true);
    $results['storage']['exists'] = is_dir($uploadDir);
    $results['storage']['writable'] = is_writable($uploadDir);
}

// 3. Test database connection
require_once __DIR__ . '/db.php';
$results['database'] = [
    'connected' => isset($conn) && $conn->ping(),
    'table_apps_exists' => false
];

if ($results['database']['connected']) {
    $res = $conn->query("SHOW TABLES LIKE 'apps'");
    $results['database']['table_apps_exists'] = $res->num_rows > 0;
}

echo json_encode($results, JSON_PRETTY_PRINT);
