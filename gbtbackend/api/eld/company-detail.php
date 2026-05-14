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

$stmt = $db->prepare("SELECT s.*, c.company_name FROM eld_company_summary s JOIN company_api_configs c ON s.company_key = c.company_key WHERE s.company_key = ?");
$stmt->execute([$company]);
$summary = $stmt->fetch();

if (!$summary) {
    echo json_encode(["status" => "error", "message" => "Company not found"]);
    exit;
}

// Decode raw JSON responses if possible
$driverData = json_decode($summary['raw_driver_response'], true);
$vehicleData = json_decode($summary['raw_vehicle_response'], true);
$clientData = json_decode($summary['raw_client_response'], true);
$healthData = json_decode($summary['raw_health_response'], true);

echo json_encode([
    "status" => "success",
    "company" => $summary['company_name'],
    "company_key" => $summary['company_key'],
    "details" => [
        "drivers" => $driverData,
        "vehicles" => $vehicleData,
        "clients" => $clientData,
        "health" => $healthData
    ],
    "last_sync" => $summary['last_sync']
]);
