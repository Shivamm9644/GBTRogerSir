<?php
require_once __DIR__ . '/../config/database.php';

$dbConfig = new Database();

try {
    $dsn = "mysql:host={$dbConfig->host};dbname={$dbConfig->db_name};charset={$dbConfig->charset}";
    $pdo = new PDO($dsn, $dbConfig->username, $dbConfig->password);
    echo "SUCCESS: Connected to " . $dbConfig->db_name;
} catch (PDOException $e) {
    echo "FAILURE: " . $e->getMessage();
}
?>