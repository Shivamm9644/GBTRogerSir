<?php
// ── Error reporting (disable in production) ───────────────────────────────────
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');
error_reporting(E_ALL);

// ── CORS Headers ──────────────────────────────────────────────────────────────
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "ERROR", "message" => "Method not allowed."]);
    exit();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// login.php is at: gbtbackend/api/auth/login.php
// database.php is at: gbtbackend/config/database.php
// So we need to go UP two levels: ../../config/database.php
$configPath = __DIR__ . '/../../config/database.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        "status"  => "ERROR",
        "message" => "Config file not found at: " . $configPath
    ]);
    exit();
}

include_once $configPath;

try {
    $database = new Database();
    $db       = $database->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "ERROR", "message" => "DB init failed: " . $e->getMessage()]);
    exit();
}

// ── Read JSON body ─────────────────────────────────────────────────────────────
$raw  = file_get_contents("php://input");
$body = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "Invalid JSON body."]);
    exit();
}

$email = trim($body['email']    ?? '');
$pass  = trim($body['password'] ?? '');

// ── Validate input ─────────────────────────────────────────────────────────────
if (empty($email) || empty($pass)) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "Email and password are required."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "ERROR", "message" => "Invalid email format."]);
    exit();
}

// ── Look up user ───────────────────────────────────────────────────────────────
try {
    $stmt = $db->prepare("
        SELECT id, name, email, password_hash, role, is_active, last_login
        FROM tbl_admin_users
        WHERE email = :email
        LIMIT 1
    ");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(["status" => "ERROR", "message" => "Invalid email or password."]);
        exit();
    }

    if (!$user['is_active']) {
        http_response_code(403);
        echo json_encode(["status" => "ERROR", "message" => "Account deactivated. Contact an administrator."]);
        exit();
    }

    // ── Verify password ────────────────────────────────────────────────────────
    if (!password_verify($pass, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["status" => "ERROR", "message" => "Invalid email or password."]);
        exit();
    }

    // ── Format previous last_login before overwriting ──────────────────────────
    $lastLoginFmt = 'Never';
    if (!empty($user['last_login'])) {
        $pstZone = new DateTimeZone('America/Los_Angeles');
        $dt = new DateTime($user['last_login'], new DateTimeZone('UTC')); // Assuming stored as UTC or similar timezone to logs.php
        $dt->setTimezone($pstZone);
        $lastLoginFmt = $dt->format('M j, Y h:i A') . ' PST';
    }

    // ── Update last_login timestamp ────────────────────────────────────────────
    $upd = $db->prepare("UPDATE tbl_admin_users SET last_login = UTC_TIMESTAMP() WHERE id = :id");
    $upd->execute([':id' => $user['id']]);

    // ── Log LOGIN action ───────────────────────────────────────────────────────
    $logStmt = $db->prepare("INSERT INTO tbl_user_logs (user_id, user_email, action, action_time) VALUES (?, ?, 'LOGIN', UTC_TIMESTAMP())");
    $logStmt->execute([(int)$user['id'], $user['email']]);

    // ── Generate session token ─────────────────────────────────────────────────
    $token = bin2hex(random_bytes(32));

    // ── Return success ─────────────────────────────────────────────────────────
    http_response_code(200);
    echo json_encode([
        "status"  => "SUCCESS",
        "message" => "Login successful.",
        "token"   => $token,
        "user"    => [
            "id"             => (int)$user['id'],
            "name"           => $user['name'],
            "email"          => $user['email'],
            "role"           => $user['role'],
            "last_login_fmt" => $lastLoginFmt,
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "ERROR", "message" => "Database error: " . $e->getMessage()]);
}
