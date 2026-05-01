<?php
$db_config = [
    'host' => '127.0.0.1',
    'db' => 'gbt_dashboard',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
];

try {
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db']};charset={$db_config['charset']}";
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass']);
    echo "SUCCESS: Connected to gbt_dashboard";
} catch (PDOException $e) {
    echo "FAILURE: " . $e->getMessage();
}
?>