<?php
require_once __DIR__ . '/../config/database.php';

$dbConfig = new Database();

try {
    $dsn = "mysql:host={$dbConfig->host};dbname={$dbConfig->db_name};charset={$dbConfig->charset}";
    $pdo = new PDO($dsn, $dbConfig->username, $dbConfig->password);
    
    echo "DESCRIBE apps:\n";
    $stmt = $pdo->query("DESCRIBE apps");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (PDOException $e) {
    echo "FAILURE: " . $e->getMessage();
}
?>
