<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/common.php';

$company = $_GET['company'] ?? '';
if (!$company) {
    echo json_encode(["status" => "error", "message" => "Company parameter is required"]);
    exit;
}

$db = getEldDb();

// Fetch summary
$stmt = $db->prepare("SELECT s.*, c.company_name FROM eld_company_summary s JOIN company_api_configs c ON s.company_key = c.company_key WHERE s.company_key = ?");
$stmt->execute([$company]);
$summary = $stmt->fetch();

if (!$summary) {
    echo json_encode(["status" => "error", "message" => "Company summary not found"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "company" => $summary['company_name'],
    "company_key" => $summary['company_key'],
    "summary" => [
        "total_drivers" => (int)$summary['total_drivers'],
        "active_vehicles" => (int)$summary['active_vehicles'],
        "total_clients" => (int)$summary['total_clients'],
        "server_status" => $summary['server_status']
    ],
    "last_sync" => $summary['last_sync']
]);
