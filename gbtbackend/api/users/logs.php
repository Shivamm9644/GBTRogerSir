<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); exit(); }

include_once __DIR__ . '/../../config/database.php';

try {
    $db = (new Database())->getConnection();

    // Fetch the 50 most recent logs
    $stmt = $db->query("SELECT id, user_id, user_email, action, action_time FROM tbl_user_logs ORDER BY action_time DESC LIMIT 50");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert times to US PST for presentation
    $pstZone = new DateTimeZone('America/Los_Angeles');

    foreach ($logs as &$log) {
        $dt = new DateTime($log['action_time'], new DateTimeZone('UTC')); // Default MySQL TIMESTAMP behavior assuming UTC connection, or fallback to server time. Let's assume server/script default is generic and we just parse it.
        $dt->setTimezone($pstZone);
        $log['pst_time'] = $dt->format('M j, Y h:i A') . ' PST';
        
        // Map user email if we need a display name, but email is fine for now
        $log['user'] = $log['user_email'];
    }

    echo json_encode(["status" => "SUCCESS", "logs" => $logs]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "ERROR", "message" => "Database error: " . $e->getMessage()]);
}
