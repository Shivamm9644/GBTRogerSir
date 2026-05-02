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
    
    echo "DESCRIBE app_artifacts:\n";
    $stmt = $pdo->query("DESCRIBE app_artifacts");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (PDOException $e) {
    echo "FAILURE: " . $e->getMessage();
}
?>
