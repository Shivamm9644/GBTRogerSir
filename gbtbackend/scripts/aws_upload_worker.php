<?php
// AWS Upload Worker Script

$id = isset($argv[1]) ? intval($argv[1]) : 0;
if ($id <= 0) {
    die("Invalid Artifact ID\n");
}

$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$logFile = $logDir . '/fastlane_' . $id . '.log';

function writeLog($logFile, $message)
{
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] " . $message . "\n", FILE_APPEND);
}

file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Starting AWS Upload Worker for Artifact ID: $id\n");

// AWS Configuration
$awsIp = "107.21.88.198";
$pemPath = "/home/lmhaiss/domains/app6.lmh-ai.in/public_html/gbtbackend/scripts/gbt_dashboard.pem";
$sshUser = "ubuntu";

@chmod($pemPath, 0600);

// DB Connection
$db_host = "localhost";
$db_name = "lmhaiss_app4";
$db_user = "lmhaiss_app4";
$db_pass = "tedzZXe4EsSptezVsH7z";

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    writeLog($logFile, "DB Connection failed: " . $conn->connect_error);
    exit;
}

$stmt = $conn->prepare("SELECT * FROM app_artifacts WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$artifact = $stmt->get_result()->fetch_assoc();

if (!$artifact) {
    writeLog($logFile, "Artifact not found in DB");
    $conn->close();
    exit;
}

$uploadDir = __DIR__ . '/../storage/apps/';
$localApkPath = $uploadDir . $artifact['binary_file_name'];

if (!file_exists($localApkPath)) {
    $msg = "Local APK not found: $localApkPath";
    writeLog($logFile, $msg);

    $safeMsg = $conn->real_escape_string($msg);
    $conn->query("UPDATE app_artifacts SET store_upload_status = 'failed', store_upload_message = '$safeMsg' WHERE id = $id");

    $conn->close();
    exit;
}

$remoteFilePathRaw = "/opt/app_deployer/binaries/" . $artifact['binary_file_name'];
$remoteFilePath = escapeshellarg($remoteFilePathRaw);

$remoteJsonKey = "/opt/app_deployer/keys/play_store_key.json";
$remoteAppleKey = "/opt/app_deployer/keys/app_store_key.p8";

$packageName = !empty($artifact['package_name'])
    ? $artifact['package_name']
    : "com.gbt." . preg_replace('/[^a-zA-Z0-9]/', '', strtolower($artifact['company']));

$conn->query("UPDATE app_artifacts SET store_upload_status = 'processing', store_upload_message = 'Uploading APK to AWS...' WHERE id = $id");

// Step 1: SCP upload
writeLog($logFile, "Transferring " . $artifact['binary_file_ext'] . " to AWS via SCP...");

$scpCmd = sprintf(
    'timeout 600 scp -o BatchMode=yes -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i "%s" "%s" %s@%s:%s 2>&1',
    $pemPath,
    $localApkPath,
    $sshUser,
    $awsIp,
    $remoteFilePath
);

writeLog($logFile, "Executing: $scpCmd");

$scpOutput = [];
$scpExitCode = 0;
exec($scpCmd, $scpOutput, $scpExitCode);
$scpResult = implode("\n", $scpOutput);

writeLog($logFile, "SCP Output:\n$scpResult");
writeLog($logFile, "SCP Exit Code: $scpExitCode");

if ($scpExitCode !== 0) {
    writeLog($logFile, "SCP failed. Fastlane trigger stopped.");

    $errorMsg = "SCP upload failed. Check log.";
    $safeMsg = $conn->real_escape_string($errorMsg);
    $conn->query("UPDATE app_artifacts SET store_upload_status = 'failed', store_upload_message = '$safeMsg' WHERE id = $id");

    $conn->close();
    exit;
}

// Step 2: Run Fastlane via SSH
$conn->query("UPDATE app_artifacts SET store_upload_status = 'processing', store_upload_message = 'Triggering Fastlane on AWS...' WHERE id = $id");

writeLog($logFile, "Triggering Fastlane on AWS for platform: " . $artifact['platform'] . "...");

$sshCmd = sprintf(
    'timeout 900 ssh -o BatchMode=yes -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i "%s" %s@%s "/opt/app_deployer/run_fastlane.sh %s %s %s %s %s" 2>&1',
    $pemPath,
    $sshUser,
    $awsIp,
    escapeshellarg($artifact['platform']),
    $remoteFilePath,
    escapeshellarg($packageName),
    escapeshellarg($remoteJsonKey),
    escapeshellarg($remoteAppleKey)
);

writeLog($logFile, "Executing: $sshCmd");

$sshOutput = [];
$sshExitCode = 0;
exec($sshCmd, $sshOutput, $sshExitCode);
$sshResult = implode("\n", $sshOutput);

writeLog($logFile, "SSH Output:\n$sshResult");
writeLog($logFile, "SSH Exit Code: $sshExitCode");

// Step 3: Parse result
if ($sshExitCode === 0 && strpos($sshResult, 'SUCCESS:') !== false) {
    writeLog($logFile, "Deployment completed successfully.");

    $successMsg = "Uploaded to " . ($artifact['platform'] == 'Android' ? 'Play Store' : 'App Store');
    $safeMsg = $conn->real_escape_string($successMsg);

    $conn->query("UPDATE app_artifacts SET store_upload_status = 'success', store_upload_message = '$safeMsg', uploaded_to_store_at = NOW() WHERE id = $id");
} else {
    writeLog($logFile, "Deployment failed.");

    if (strpos($sshResult, 'Invalid JWT Signature') !== false || strpos($sshResult, 'invalid_grant') !== false) {
        $errorMsg = "Google Play service account key is invalid. Replace play_store_key.json.";
    } elseif (strpos($sshResult, 'version code') !== false) {
        $errorMsg = "APK version code issue. Increase versionCode and retry.";
    } elseif (strpos($sshResult, 'packageName') !== false || strpos($sshResult, 'package name') !== false) {
        $errorMsg = "Package name issue. Check package_name in artifact.";
    } elseif ($sshExitCode === 124) {
        $errorMsg = "Fastlane timed out.";
    } else {
        $errorMsg = "Deployment failed. Check log.";
    }

    $safeMsg = $conn->real_escape_string($errorMsg);
    $conn->query("UPDATE app_artifacts SET store_upload_status = 'failed', store_upload_message = '$safeMsg' WHERE id = $id");
}

$conn->close();
?>