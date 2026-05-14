<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

require_once __DIR__ . '/common.php';

$company = $_GET['company'] ?? '';
if (!$company) {
    echo json_encode(["status" => "error", "message" => "Company parameter is required"]);
    exit;
}

$db = getEldDb();

// Fetch config
$stmt = $db->prepare("SELECT * FROM company_api_configs WHERE company_key = ? AND status = 'active'");
$stmt->execute([$company]);
$config = $stmt->fetch();

if (!$config) {
    echo json_encode(["status" => "error", "message" => "Company config not found or inactive"]);
    exit;
}

$baseUrl = rtrim($config['base_url'], '/');

// APIs to call
$apis = [
    'drivers' => $baseUrl . $config['driver_endpoint'],
    'vehicles' => $baseUrl . $config['vehicle_endpoint'],
    'clients' => $baseUrl . $config['client_endpoint'],
    'server_health' => $baseUrl . $config['server_health_endpoint']
];

$results = [
    'total_drivers' => 0,
    'active_vehicles' => 0,
    'total_clients' => 0,
    'server_status' => 'offline',
    'raw_driver' => '',
    'raw_vehicle' => '',
    'raw_client' => '',
    'raw_health' => ''
];

$successCount = 0;

foreach ($apis as $key => $url) {
    // The spec says POST for some APIs in angular, but standard is GET, let's try POST if Angular used POST.
    // In Angular they used POST for view_server_health and view_project_detail_analytics.
    // Let's use GET first, if the APIs require POST we might need to adjust. I'll use POST.
    $res = fetchExternalApi($url, 'POST', []);
    
    logSync($db, $company, $key, $url, $res['status'], $res['code'], $res['error'] ?: 'OK');
    
    if ($res['status'] === 'success') {
        $data = json_decode($res['response'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $successCount++;
            
            // Extract data based on expected TruckerTrace format
            if ($key === 'drivers') {
                $results['raw_driver'] = $res['response'];
                if (isset($data['result']) && is_array($data['result'])) {
                    $results['total_drivers'] = count($data['result']);
                } elseif (isset($data['result']['totalDrivers'])) {
                    $results['total_drivers'] = $data['result']['totalDrivers'];
                }
            } elseif ($key === 'vehicles') {
                $results['raw_vehicle'] = $res['response'];
                if (isset($data['result']) && is_array($data['result'])) {
                    $results['active_vehicles'] = count($data['result']);
                } elseif (isset($data['result']['totalVehicles'])) {
                    $results['active_vehicles'] = $data['result']['totalVehicles'];
                }
            } elseif ($key === 'clients') {
                $results['raw_client'] = $res['response'];
                if (isset($data['result']) && is_array($data['result'])) {
                    $results['total_clients'] = count($data['result']);
                }
            } elseif ($key === 'server_health') {
                $results['raw_health'] = $res['response'];
                if (isset($data['result']['status']) && $data['result']['status'] === 'success') {
                    $results['server_status'] = 'online';
                }
            }
        } else {
             logSync($db, $company, $key, $url, 'error', $res['code'], 'Invalid JSON response');
        }
    }
}

// Update Summary Table
$updateStmt = $db->prepare("UPDATE eld_company_summary SET 
    total_drivers = ?, active_vehicles = ?, total_clients = ?, server_status = ?, 
    raw_driver_response = ?, raw_vehicle_response = ?, raw_client_response = ?, raw_health_response = ?, 
    last_sync = CURRENT_TIMESTAMP 
    WHERE company_key = ?");

$updateStmt->execute([
    $results['total_drivers'],
    $results['active_vehicles'],
    $results['total_clients'],
    $results['server_status'],
    $results['raw_driver'],
    $results['raw_vehicle'],
    $results['raw_client'],
    $results['raw_health'],
    $company
]);

echo json_encode([
    "status" => "success",
    "message" => "Sync completed",
    "apis_successful" => $successCount,
    "summary" => [
        "total_drivers" => $results['total_drivers'],
        "active_vehicles" => $results['active_vehicles'],
        "total_clients" => $results['total_clients'],
        "server_status" => $results['server_status']
    ]
]);
