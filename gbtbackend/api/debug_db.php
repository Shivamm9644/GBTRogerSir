<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../config/database.php';

$dbConfig = new Database();

try {
    $dsn = "mysql:host={$dbConfig->host};dbname={$dbConfig->db_name}";
    $pdo = new PDO($dsn, $dbConfig->username, $dbConfig->password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Check if app_artifacts table exists (compatibility check)
    $stmt = $pdo->query("SELECT id, company, app_version, created_at FROM apps LIMIT 20");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>