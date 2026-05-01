<?php
header("Content-Type: application/json");
$db_config = [
    'host' => 'localhost',
    'db' => 'gbt_dashboard',
    'user' => 'root',
    'pass' => '',
];
try {
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db']}";
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query("SELECT id, company, app_type, platform, app_version, is_latest, archive_status, created_at FROM app_artifacts WHERE company = 'ABC' OR 1=1 LIMIT 20");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>