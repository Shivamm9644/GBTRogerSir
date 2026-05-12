<?php
// AWS Upload Worker Script
// This script runs in the background to handle long-running SCP and SSH tasks without blocking the UI.

$id = isset($argv[1]) ? intval($argv[1]) : 0;
if ($id <= 0) {
    die("Invalid Artifact ID\n");
}

$logFile = __DIR__ . '/../logs/fastlane_' . $id . '.log';
file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Starting AWS Upload Worker for Artifact ID: $id\n");

// Configuration (Ensure these match your AWS settings)
$awsIp = "107.21.88.198"; // <-- Updated to Public IP
$pemPath = "C:\\Users\\shiva\\Downloads\\gbt_dashboard.pem";
$sshUser = "ubuntu";

// DB Connection
$db_host = "localhost";
$db_name = "lmhaiss_app4";
$db_user = "lmhaiss_app4";
$db_pass = "tedzZXe4EsSptezVsH7z";

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    file_put_contents($logFile, "DB Connection failed: " . $conn->connect_error . "\n", FILE_APPEND);
    exit;
}

$stmt = $conn->prepare("SELECT * FROM app_artifacts WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$artifact = $stmt->get_result()->fetch_assoc();

if (!$artifact) {
    file_put_contents($logFile, "Artifact not found in DB\n", FILE_APPEND);
    exit;
}

$uploadDir = __DIR__ . '/../storage/apps/';
$localApkPath = $uploadDir . $artifact['binary_file_name'];

if (!file_exists($localApkPath)) {
    $msg = "Local APK not found: $localApkPath";
    file_put_contents($logFile, $msg . "\n", FILE_APPEND);
    $conn->query("UPDATE app_artifacts SET store_upload_status = 'failed', store_upload_message = '" . $conn->real_escape_string($msg) . "' WHERE id = $id");
    exit;
}

$remoteFilePath = "/opt/app_deployer/binaries/" . escapeshellarg($artifact['binary_file_name']);
$remoteJsonKey = "/opt/app_deployer/keys/play_store_key.json";
$remoteAppleKey = "/opt/app_deployer/keys/app_store_key.p8"; // Placeholder for iOS key
$packageName = !empty($artifact['package_name']) ? $artifact['package_name'] : "com.gbt." . preg_replace('/[^a-zA-Z0-9]/', '', strtolower($artifact['company']));

// Step 1: SCP the file to AWS
file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Transferring " . $artifact['binary_file_ext'] . " to AWS via SCP...\n", FILE_APPEND);
$scpCmd = sprintf(
    'scp -o StrictHostKeyChecking=no -i "%s" "%s" %s@%s:%s 2>&1',
    $pemPath,
    $localApkPath,
    $sshUser,
    $awsIp,
    $remoteFilePath
);

file_put_contents($logFile, "Executing: $scpCmd\n", FILE_APPEND);
$scpResult = shell_exec($scpCmd);
file_put_contents($logFile, "SCP Output:\n$scpResult\n", FILE_APPEND);

// Step 2: Run Fastlane via SSH
file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Triggering Fastlane on AWS for platform: " . $artifact['platform'] . "...\n", FILE_APPEND);

// We pass platform and file path to the remote script
$sshCmd = sprintf(
    'ssh -o StrictHostKeyChecking=no -i "%s" %s@%s "/opt/app_deployer/run_fastlane.sh %s %s %s %s %s" 2>&1',
    $pemPath,
    $sshUser,
    $awsIp,
    escapeshellarg($artifact['platform']),
    $remoteFilePath,
    escapeshellarg($packageName),
    $remoteJsonKey,
    $remoteAppleKey
);

file_put_contents($logFile, "Executing: $sshCmd\n", FILE_APPEND);
$sshResult = shell_exec($sshCmd);
file_put_contents($logFile, "SSH Output:\n$sshResult\n", FILE_APPEND);

// Step 3: Parse result and update DB
if (strpos($sshResult, 'SUCCESS:') !== false) {
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Deployment completed successfully.\n", FILE_APPEND);
    $conn->query("UPDATE app_artifacts SET store_upload_status = 'success', store_upload_message = 'Uploaded to " . ($artifact['platform'] == 'Android' ? 'Play Store' : 'App Store') . "', uploaded_to_store_at = NOW() WHERE id = $id");
} else {
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Deployment failed.\n", FILE_APPEND);
    $errorMsg = "Deployment failed. Check log.";
    $conn->query("UPDATE app_artifacts SET store_upload_status = 'failed', store_upload_message = '" . $conn->real_escape_string($errorMsg) . "' WHERE id = $id");
}

$conn->close();
?>