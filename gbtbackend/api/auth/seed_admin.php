<?php
/**
 * Run this file ONCE in the browser or CLI to insert the default admin user.
 * URL: http://localhost/RogersirCRMV2/backend/api/auth/seed_admin.php
 *
 * DELETE this file after running it!
 */

include_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db       = $database->getConnection();

$name     = 'GBT Admin';
$email    = 'admin@gbt.com';
$password = 'admin123';          // Change to your desired password
$role     = 'System Admin';
$hash     = password_hash($password, PASSWORD_BCRYPT);

try {
    // Check if user already exists
    $check = $db->prepare("SELECT id FROM tbl_admin_users WHERE email = ?");
    $check->execute([$email]);

    if ($check->fetch()) {
        // Update existing user's password
        $stmt = $db->prepare("UPDATE tbl_admin_users SET password_hash = ?, name = ?, role = ? WHERE email = ?");
        $stmt->execute([$hash, $name, $role, $email]);
        echo "<p style='color:green;font-family:monospace'>✅ Admin user <b>$email</b> password updated successfully.</p>";
    } else {
        // Insert new user
        $stmt = $db->prepare("INSERT INTO tbl_admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hash, $role]);
        echo "<p style='color:green;font-family:monospace'>✅ Admin user <b>$email</b> created successfully.</p>";
    }

    echo "<p style='font-family:monospace'>📧 Email: <b>$email</b><br>🔑 Password: <b>$password</b></p>";
    echo "<p style='color:red;font-family:monospace'>⚠️ DELETE this file now for security!</p>";

} catch (PDOException $e) {
    echo "<p style='color:red'>❌ Error: " . $e->getMessage() . "</p>";
}
