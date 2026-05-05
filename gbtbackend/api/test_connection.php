<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Diagnostic Start</h1>";

$configPath = __DIR__ . '/../config/database.php';
echo "Checking config at: $configPath <br>";

if (file_exists($configPath)) {
    echo "✅ Config file exists.<br>";
    require_once $configPath;
} else {
    echo "❌ Config file NOT found.<br>";
    exit;
}

$db = new Database();
echo "Database class initialized.<br>";

echo "Attempting MySQLi connection to $db->host ...<br>";
try {
    $conn = new mysqli($db->host, $db->username, $db->password, $db->db_name);
    echo "✅ MySQLi Connection Successful!<br>";
    
    $res = $conn->query("SHOW TABLES LIKE 'apps'");
    if ($res->num_rows > 0) {
        echo "✅ 'apps' table exists.<br>";
    } else {
        echo "❌ 'apps' table missing.<br>";
    }
} catch (Exception $e) {
    echo "❌ MySQLi Connection Failed: " . $e->getMessage() . "<br>";
}

echo "Attempting PDO connection...<br>";
try {
    $pdo = $db->getConnection();
    if ($pdo) {
        echo "✅ PDO Connection Successful!<br>";
    }
} catch (Exception $e) {
    echo "❌ PDO Connection Failed: " . $e->getMessage() . "<br>";
}

echo "<h1>Diagnostic End</h1>";
