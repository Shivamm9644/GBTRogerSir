<?php
$db_config = [
    'host' => '127.0.0.1',
    'db' => 'gbt_dashboard',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
];
$dsn = "mysql:host={$db_config['host']};dbname={$db_config['db']};charset={$db_config['charset']}";
$pdo = new PDO($dsn, $db_config['user'], $db_config['pass']);

$companies = ["AllstarELd", "Shrine", "Semi ELD", "All Star"];
foreach ($companies as $c) {
    $stmt = $pdo->prepare("SELECT package_name FROM companies WHERE company_name = ?");
    $stmt->execute([$c]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Company: $c | Package Name: " . ($row['package_name'] ?? 'NULL') . "\n";
}
