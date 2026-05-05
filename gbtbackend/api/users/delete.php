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

$id = $body['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "User ID required."]);
    exit();
}

try {
    $db = (new Database())->getConnection();

    // Do not allow deleting self or super admin blindly if needed.
    // We assume the frontend sends the user id to permanently delete.
    
    // Check if user exists
    $check = $db->prepare("SELECT id FROM tbl_admin_users WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["status" => "ERROR", "message" => "User not found."]);
        exit();
    }

    $stmt = $db->prepare("DELETE FROM tbl_admin_users WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["status" => "SUCCESS", "message" => "User deleted permanently."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "ERROR", "message" => "Database error: " . $e->getMessage()]);
}
