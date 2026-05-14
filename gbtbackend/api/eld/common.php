<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/db_setup.php'; // ensure tables exist

function getEldDb() {
    $database = new Database();
    return $database->getConnection();
}

function fetchExternalApi($url, $method = 'GET', $data = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 seconds timeout
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            $payload = json_encode($data);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'status' => $httpCode >= 200 && $httpCode < 300 ? 'success' : 'error',
        'code' => $httpCode,
        'response' => $response,
        'error' => $error
    ];
}

function logSync($db, $companyKey, $apiName, $url, $status, $code, $message) {
    try {
        $stmt = $db->prepare("INSERT INTO eld_sync_logs (company_key, api_name, api_url, status, response_code, message) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$companyKey, $apiName, $url, $status, $code, $message]);
    } catch (Exception $e) {
        // ignore log failures
    }
}
