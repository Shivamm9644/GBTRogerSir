<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit(); }

include_once __DIR__ . '/../../config/database.php';

$raw = file_get_contents("php://input");
$body = json_decode($raw, true);

$userId = $body['userId'] ?? null;
$email  = trim($body['email'] ?? '');

if (!$userId || empty($email)) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "User ID and Email are required to log out cleanly."]);
    exit();
}

try {
    $db = (new Database())->getConnection();

    // ── Log LOGOUT action ──────────────────────────────────────────────────────
    $logStmt = $db->prepare("INSERT INTO tbl_user_logs (user_id, user_email, action, action_time) VALUES (?, ?, 'LOGOUT', UTC_TIMESTAMP())");
    $logStmt->execute([(int)$userId, $email]);

    echo json_encode(["status" => "SUCCESS", "message" => "Logout logged securely."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "ERROR", "message" => "Database error: " . $e->getMessage()]);
}
