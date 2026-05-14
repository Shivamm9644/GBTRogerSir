<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/common.php';

$db = getEldDb();

// Fetch summary for all active companies
$stmt = $db->prepare("SELECT s.company_key, s.server_status, c.company_name FROM eld_company_summary s JOIN company_api_configs c ON s.company_key = c.company_key WHERE c.status = 'active'");
$stmt->execute();
$summaries = $stmt->fetchAll();

$data = [];
foreach ($summaries as $summary) {
    $data[] = [
        "company" => $summary['company_name'],
        "company_key" => $summary['company_key'],
        "server_status" => $summary['server_status']
    ];
}

echo json_encode([
    "status" => "success",
    "data" => $data
]);
