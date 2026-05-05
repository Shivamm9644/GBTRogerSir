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

$name = trim($body['name'] ?? '');
$email = trim($body['email'] ?? '');
$password = trim($body['password'] ?? '');
$role = trim($body['role'] ?? 'Sub Admin');

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "Name, email, and password are required."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "Invalid email format."]);
    exit();
}

try {
    $db = (new Database())->getConnection();

    // Check if email already exists
    $checkEmail = $db->prepare("SELECT id FROM tbl_admin_users WHERE email = ?");
    $checkEmail->execute([$email]);
    if ($checkEmail->fetch()) {
        http_response_code(400);
        echo json_encode(["status" => "ERROR", "message" => "Email already registered."]);
        exit();
    }

    // Role Admin count check (Max 3 Admins allowed)
    // The user has predefined 'admin' and 'sub admin'. Case-insensitive check.
    if (strtolower($role) === 'admin' || strtolower($role) === 'system admin') {
        $checkAdmin = $db->query("SELECT COUNT(*) as count FROM tbl_admin_users WHERE LOWER(role) IN ('admin', 'system admin')");
        $res = $checkAdmin->fetch(PDO::FETCH_ASSOC);
        if ($res && $res['count'] >= 3) {
            http_response_code(400);
            echo json_encode(["status" => "ERROR", "message" => "Maximum of 3 Administrators allowed."]);
            exit();
        }
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $db->prepare("INSERT INTO tbl_admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hash, $role]);

    echo json_encode(["status" => "SUCCESS", "message" => "User created successfully."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "ERROR", "message" => "Database error: " . $e->getMessage()]);
}
