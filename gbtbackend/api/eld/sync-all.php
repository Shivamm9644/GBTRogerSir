<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');

require_once __DIR__ . '/common.php';

$db = getEldDb();

// Fetch config for all active companies
$stmt = $db->prepare("SELECT company_key FROM company_api_configs WHERE status = 'active'");
$stmt->execute();
$companies = $stmt->fetchAll();

$results = [];

// Determine base URL dynamically for self API call
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
$basePath = dirname($_SERVER['REQUEST_URI']); // path to current directory

foreach ($companies as $c) {
    $companyKey = $c['company_key'];
    // Call the sync-company.php script.
    // Instead of doing curl, we can just include it or better yet curl our own API to keep it isolated.
    $url = $protocol . $domainName . $basePath . '/sync-company.php?company=' . urlencode($companyKey);
    $res = fetchExternalApi($url, 'POST');
    
    $results[$companyKey] = [
        "status" => $res['status'] === 'success' ? 'synced' : 'failed',
        "code" => $res['code']
    ];
}

echo json_encode([
    "status" => "success",
    "message" => "Sync all completed",
    "results" => $results
]);
