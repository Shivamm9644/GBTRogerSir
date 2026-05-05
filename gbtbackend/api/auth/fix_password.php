<?php
/**
 * Quick Fix: Resets admin password to admin123
 * Run once: http://localhost/gbtbackend/api/auth/fix_password.php
 * DELETE this file after running!
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db       = $database->getConnection();

$email    = 'admin@gbt.com';
$password = 'admin123';
$hash     = password_hash($password, PASSWORD_BCRYPT);

// Test it immediately
$ok = password_verify($password, $hash);

echo "<pre style='font-family:monospace; font-size:14px; padding:20px;'>";
echo "Generated hash: $hash\n";
echo "Verify test: " . ($ok ? "✅ PASS" : "❌ FAIL") . "\n\n";

// Check if user exists
$check = $db->prepare("SELECT id, password_hash FROM tbl_admin_users WHERE email = ?");
$check->execute([$email]);
$existing = $check->fetch();

if ($existing) {
    // Update
    $stmt = $db->prepare("UPDATE tbl_admin_users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$hash, $email]);
    echo "✅ Password UPDATED for: $email\n";
    echo "Old hash was: " . $existing['password_hash'] . "\n";
    echo "New hash is:  $hash\n";
} else {
    // Insert
    $stmt = $db->prepare("INSERT INTO tbl_admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    $stmt->execute(['GBT Admin', $email, $hash, 'System Admin']);
    echo "✅ User CREATED: $email\n";
    echo "Hash: $hash\n";
}

echo "\n🔑 Login with:\n";
echo "   Email   : $email\n";
echo "   Password: $password\n";
echo "\n⚠️  DELETE this file now!\n";
echo "</pre>";
