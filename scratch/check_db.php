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
    $stmt = $pdo->query("SELECT * FROM companies");
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($companies, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
