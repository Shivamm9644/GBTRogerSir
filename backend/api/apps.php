<?php
/**
 * Apps Repository Production API (V2)
 */

// Permissive CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = $_GET['cmd'] ?? ($_POST['cmd'] ?? '');

// Logging for debug
$logFile = __DIR__ . '/../logs/api_debug.log';
$logMsg = date('[Y-m-d H:i:s] ') . $_SERVER['REQUEST_METHOD'] . " cmd=" . ($action ?: 'none') . "\n";
file_put_contents($logFile, $logMsg, FILE_APPEND);

// Database configuration
$db_config = [
    'host' => '127.0.0.1',
    'db' => 'gbt_dashboard',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
];

$dsn = "mysql:host={$db_config['host']};dbname={$db_config['db']};charset={$db_config['charset']}";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], $options);
} catch (\PDOException $e) {
    $companyCheck = $_POST['company'] ?? $_GET['company'] ?? '';
    if ($companyCheck !== 'GBT_TEST_MOCK' && $companyCheck !== 'allstar') {
        http_response_code(500);
        echo json_encode(["message" => "Database connection failed", "error" => $e->getMessage()]);
        exit;
    }
}

// Handle Request
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($pdo, $action);
        break;
    case 'POST':
        handlePost($pdo, $action);
        break;
}

/**
 * Dispatch GET actions
 */
function handleGet($pdo, $action)
{
    if ($action === 'check_live_version') {
        checkLiveVersion($pdo);
        return;
    }
    if ($action === 'get_all_archives') {
        getAllArchives($pdo);
        return;
    }

    try {
        if (!$pdo)
            throw new Exception("Database mock mode active");
        // Sort by created_at DESC so new uploads show at top
        $stmt = $pdo->query("SELECT * FROM app_artifacts WHERE is_latest = 1 ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to fetch apps", "error" => $e->getMessage()]);
    }
}

/**
 * Dispatch POST actions
 */
function handlePost($pdo, $action)
{
    if (!$action) {
        // Check for raw JSON action
        $raw = json_decode(file_get_contents("php://input"), true);
        $_POST = array_merge($_POST, $raw ?? []);
    }

    switch ($action) {
        case 'save_app':
            saveApp($pdo);
            break;
        case 'archive':
            archiveApp($pdo);
            break;
        case 'history':
            getHistory($pdo);
            break;
        case 'store_upload':
            triggerStoreUpload($pdo);
            break;
        case 'get_all_archives':
            getAllArchives($pdo);
            break;
        case 'save_master_zip':
            saveMasterZip($pdo);
            break;
        case 'restore':
            restoreApp($pdo);
            break;
        case 'get_zip_contents':
            getZipContents($pdo);
            break;
        case 'delete':
            deleteApp($pdo);
            break;
        case 'update_status':
            updateStatus($pdo);
            break;
        case 'login_sync':
            loginSync($pdo);
            break;
        case 'check_live_version':
            checkLiveVersion($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(["message" => "Invalid or missing action (cmd)"]);
            break;
    }
}

/**
 * Save new artifact with file upload and archival logic
 */
function saveApp($pdo)
{
    $company = trim($_POST['company'] ?? '');

    // MOCK BYPASS FOR DEMONSTRATION (When DB is unreachable)
    if ($company === 'GBT_TEST_MOCK') {
        $description = trim($_POST['description'] ?? 'Mock Test');
        $platform = strtolower(trim($_POST['platform'] ?? 'android'));
        $version = trim($_POST['app_version'] ?? '1.2.3');

        $mockFile = ($platform === 'ios') ? "dummy_test_app.ipa" : "test_app.apk";

        echo json_encode([
            "status" => "success",
            "message" => "Artifact saved and store upload triggered!",
            "id" => "MOCK_" . time()
        ]);

        // Trigger the Fastlane script anyway (it runs in background)
        executeFastlane($pdo, "MOCK_ID", $company, $platform, $version, $mockFile);
        return;
    }

    $type = trim($_POST['app_type'] ?? '');
    $platform = trim($_POST['platform'] ?? '');
    $version = trim($_POST['app_version'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $os_version = trim($_POST['os_version'] ?? '');

    // ... (rest of the vars)
    $hardware = $_POST['hardware'] ?? '';
    $fw_version = $_POST['firmware_version'] ?? '';
    $effective_date = $_POST['effective_date'] ?? date('M d, Y');
    $status = $_POST['artifact_status'] ?? 'Stable';
    $dot_cancelled = isset($_POST['dot_cancelled']) ? intval($_POST['dot_cancelled']) : 0;

    // 1. Handle File Upload
    $fileName = '';
    $filePath = '';
    $fileExt = '';

    if (isset($_FILES['binary'])) {
        $tempPath = $_FILES['binary']['tmp_name'];
        $originalName = $_FILES['binary']['name'];
        $fileInfo = pathinfo($originalName);
        $fileExt = $fileInfo['extension'];
        
        // Strictly use Original Name for ALL uploads to avoid confusion, 
        // or add timestamp ONLY for non-manual to avoid collisions if needed.
        if ($company === 'Manual Archive' || $type === 'Source Master') {
            $fileName = $originalName;
        } else {
            $fileName = time() . "_" . $originalName;
        }
        
        $uploadDir = '../storage/apps/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($tempPath, $filePath)) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to save uploaded file"]);
            return;
        }
    }

    $is_latest = isset($_POST['is_latest']) ? intval($_POST['is_latest']) : 1;
    $archive_status = ($is_latest === 1) ? 'active' : 'archived';

    try {
        $pdo->beginTransaction();

        // 2. Archival Logic: Only if this is a NEW LATEST record
        if ($is_latest === 1) {
            $stmt = $pdo->prepare("UPDATE app_artifacts SET is_latest = 0, archive_status = 'archived', archived_at = NOW() 
                                  WHERE company = ? AND platform = ? AND app_type = ? AND is_latest = 1");
            $stmt->execute([$company, $platform, $type]);
        }

        // 3. Insert New Record
        $sql = "INSERT INTO app_artifacts (
            company, description, app_type, platform, app_version, os_version, 
            hardware, firmware_version, effective_date, artifact_status,
            binary_file_name, binary_file_path, binary_file_ext,
            is_latest, archive_status, is_encrypted, is_locked, dot_cancelled, trigger_login_update, created_at, archived_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, 
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, 1, 1, ?, 0, NOW(), " . ($is_latest === 0 ? "NOW()" : "NULL") . "
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $company,
            $description,
            $type,
            $platform,
            $version,
            $os_version,
            $hardware,
            $fw_version,
            $effective_date,
            $status,
            $fileName,
            $filePath,
            $fileExt,
            $is_latest,
            $archive_status,
            $dot_cancelled
        ]);

        $newId = $pdo->lastInsertId();
        $pdo->commit();

        echo json_encode(["message" => "Artifact saved successfully", "id" => $newId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

/**
 * Manually move a record to archive
 */
function archiveApp($pdo)
{
    $id = $_POST['id'] ?? null;
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "ID required"]);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE app_artifacts SET is_latest = 0, archive_status = 'archived', archived_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Moved to Archive"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Fetch archived history for a specific app
 */
function getHistory($pdo)
{
    $company = $_POST['company'] ?? '';
    $type = $_POST['app_type'] ?? '';
    $platform = $_POST['platform'] ?? '';

    try {
        $stmt = $pdo->prepare("SELECT * FROM app_artifacts 
                              WHERE company = ? AND app_type = ? AND platform = ? 
                              ORDER BY created_at DESC");
        $stmt->execute([$company, $type, $platform]);
        echo json_encode($stmt->fetchAll());
    } catch (Exception $e) {
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }
}


/**
 * Delete app record
 */
function deleteApp($pdo)
{
    $id = $_POST['id'] ?? null;
    if (!$id)
        return;

    try {
        $stmt = $pdo->prepare("DELETE FROM app_artifacts WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Deleted successfully"]);
    } catch (Exception $e) {
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Trigger Store Upload and End User Update flag
 */
function triggerStoreUpload($pdo)
{
    $id = $_GET['id'] ?? null;
    if (!$id)
        return;

    try {
        // 1. Fetch app details to get platform and file path
        $stmt = $pdo->prepare("SELECT * FROM app_artifacts WHERE id = ?");
        $stmt->execute([$id]);
        $app = $stmt->fetch();

        if (!$app) {
            echo json_encode(["message" => "App not found"]);
            return;
        }

        // 2. Update status and trigger flag
        $stmt = $pdo->prepare("UPDATE app_artifacts SET trigger_login_update = 1, store_upload_status = 'processing' WHERE id = ?");
        $stmt->execute([$id]);

        // 3. Execute background shell script via helper
        executeFastlane($pdo, $id, $app['company'], $app['platform'], $app['app_version'], $app['binary_file_path']);

        echo json_encode(["message" => "Fastlane automation triggered for " . $app['platform'], "success" => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error triggering store update: " . $e->getMessage()]);
    }
}

/**
 * Helper to get the App Identifier for a company
 * In production, this would be a DB lookup from the companies table.
 */
// function getAppIdentifier($company)
// {
//     $cleanName = strtolower(preg_replace("/[^a-zA-Z0-9]/", "", $company));
//     if (empty($cleanName))
//         $cleanName = "default";
//     return "com." . $cleanName . ".eld";
// }
function getAppIdentifier($pdo, $company)
{
    $stmt = $pdo->prepare("SELECT package_name FROM companies WHERE company_name = ? LIMIT 1");
    $stmt->execute([$company]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || empty($row['package_name'])) {
        return null;
    }

    return trim($row['package_name']);
}

/**
 * Execute Fastlane in the background
 */
function executeFastlane($pdo, $id, $company, $platform, $version, $filePath)
{
    $appIdentifier = getAppIdentifier($pdo, $company);
    $script_path = realpath(__DIR__ . '/../scripts/fastlane_upload.sh');
    $platform_low = strtolower($platform);
    $log_path = __DIR__ . '/../logs/fastlane_' . $id . '.log';

    if (!is_dir(__DIR__ . '/../logs')) {
        mkdir(__DIR__ . '/../logs', 0777, true);
    }

    $cmd = "bash \"$script_path\" \"$platform_low\" \"$filePath\" \"$version\" \"$id\" \"$appIdentifier\" > \"$log_path\" 2>&1 &";

    // Windows background execution workaround
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $cmd = "start /B bash \"$script_path\" \"$platform_low\" \"$filePath\" \"$version\" \"$id\" \"$appIdentifier\" > \"$log_path\" 2>&1";
    }

    if ($script_path && file_exists($script_path)) {
        @exec($cmd);
    }
}

/**
 * Update store upload status (called by automation scripts)
 */
function updateStatus($pdo)
{
    $id = $_POST['id'] ?? null;
    $status = $_POST['status'] ?? 'pending';
    $message = $_POST['message'] ?? '';

    if (!$id)
        return;

    try {
        $stmt = $pdo->prepare("UPDATE app_artifacts SET store_upload_status = ?, store_upload_message = ?, uploaded_to_store_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $message, $id]);
        echo json_encode(["message" => "Status updated"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error updating status: " . $e->getMessage()]);
    }
}

/**
 * Endpoint for end-user apps to check for updates during login
 */
function loginSync($pdo)
{
    $company = $_POST['company'] ?? '';
    $platform = $_POST['platform'] ?? '';
    $app_type = $_POST['app_type'] ?? '';

    try {
        $stmt = $pdo->prepare("SELECT app_version, os_version, dot_cancelled, trigger_login_update 
                              FROM app_artifacts 
                              WHERE company = ? AND platform = ? AND app_type = ? AND is_latest = 1");
        $stmt->execute([$company, $platform, $app_type]);
        $latest = $stmt->fetch();

        if (!$latest) {
            echo json_encode(["message" => "No record found for this app configuration."]);
            return;
        }

        echo json_encode($latest);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Sync error: " . $e->getMessage()]);
    }
}

/**
 * Handle Developer Master App Source ZIPs
 */
function saveMasterZip($pdo)
{
    $company = $_POST['company'] ?? 'GBT';
    $app_name = $_POST['app_name'] ?? '';
    $notes = $_POST['notes'] ?? '';

    // 1. File Upload
    $fileName = '';
    $filePath = '';
    $fileExt = '';

    if (isset($_FILES['master_zip'])) {
        $uploadDir = '../storage/apps/master/';
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0777, true);

        $fileInfo = pathinfo($_FILES['master_zip']['name']);
        $fileExt = $fileInfo['extension'];
        $cleanName = preg_replace("/[^a-zA-Z0-9]/", "_", "Master_" . $company . "_" . $app_name . "_" . time());
        $fileName = $cleanName . "." . $fileExt;
        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($_FILES['master_zip']['tmp_name'], $filePath)) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to save ZIP file"]);
            return;
        }
    }

    try {
        $pdo->beginTransaction();

        // 2. Archive Previous Master Apps with the same App Name
        $stmt = $pdo->prepare("UPDATE app_artifacts SET archive_status = 'archived_master', is_latest = 0 WHERE app_version = ? AND archive_status = 'master'");
        $stmt->execute([$app_name]);

        // 3. Insert New Master ZIP explicitly as 'master' status in the archive view
        $sql = "INSERT INTO app_artifacts (
            company, description, app_type, platform, app_version, 
            artifact_status, binary_file_name, binary_file_path, binary_file_ext,
            is_latest, archive_status, is_encrypted, is_locked, created_at, archived_at
        ) VALUES (
            ?, ?, 'Master Source', 'Binary', ?, 
            'Latest', ?, ?, ?,
            1, 'master', 1, 1, NOW(), NOW()
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $company,
            $notes, // Storing dev notes inside description column
            $app_name, // Storing App Name inside version column to match schema
            $fileName,
            $filePath,
            $fileExt
        ]);

        $newId = $pdo->lastInsertId();
        $pdo->commit();

        echo json_encode(["message" => "Master App ZIP successfully uploaded and locked in Archive.", "id" => $newId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

/**
 * Check Live Version from Google Play API natively
 */
function checkLiveVersion($pdo)
{
    $company = $_GET['company'] ?? '';
    if (empty($company)) {
        echo json_encode(["status" => "error", "message" => "Company required"]);
        return;
    }

    // $packageName = getAppIdentifier($company);
    $packageName = getAppIdentifier($pdo, $company);

    if (!$packageName) {
        echo json_encode([
            "status" => "error",
            "message" => "Package name missing for company: " . $company
        ]);
        return;
    }
    // Relative to backend/api -> root/fastlane
    $keyPath = realpath(__DIR__ . '/../../fastlane/google_play_key.json');

    if (!$keyPath || !file_exists($keyPath)) {
        echo json_encode(["status" => "error", "message" => "Google Play Key missing at expected path"]);
        return;
    }

    $keyFile = json_decode(file_get_contents($keyPath), true);
    if (!isset($keyFile['client_email']) || !isset($keyFile['private_key'])) {
        echo json_encode(["status" => "error", "message" => "Invalid JSON Key"]);
        return;
    }

    try {
        // 1. Generate JWT for Server-to-Server Auth
        $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
        $now = time();
        $claim = json_encode([
            'iss' => $keyFile['client_email'],
            'scope' => 'https://www.googleapis.com/auth/androidpublisher',
            'aud' => 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now
        ]);

        $b64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $b64UrlClaim = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($claim));

        $signature = '';
        openssl_sign($b64UrlHeader . "." . $b64UrlClaim, $signature, $keyFile['private_key'], OPENSSL_ALGO_SHA256);
        $b64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        $jwt = $b64UrlHeader . "." . $b64UrlClaim . "." . $b64UrlSignature;

        // 2. Fetch Access Token via OAuth2
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $tokenRes = curl_exec($ch);
        curl_close($ch);
        $tokenData = json_decode($tokenRes, true);

        if (empty($tokenData['access_token'])) {
            throw new Exception("Auth Failed: " . ($tokenData['error_description'] ?? 'Unknown Error'));
        }
        $accessToken = $tokenData['access_token'];
        $authHeader = ["Authorization: Bearer $accessToken", "Accept: application/json"];

        // 3. Create Edit to interact with Publisher API
        $ch = curl_init("https://androidpublisher.googleapis.com/androidpublisher/v3/applications/$packageName/edits");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $editRes = curl_exec($ch);
        curl_close($ch);
        $editData = json_decode($editRes, true);

        if (empty($editData['id'])) {
            throw new Exception("Play Console API not configured or package not found.");
        }
        $editId = $editData['id'];

        // 4. Fetch Tracks Data (Production)
        $ch = curl_init("https://androidpublisher.googleapis.com/androidpublisher/v3/applications/$packageName/edits/$editId/tracks/production");
        curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $trackRes = curl_exec($ch);
        curl_close($ch);
        $trackData = json_decode($trackRes, true);

        // 5. Cleanup the Edit instance (Important for quotas)
        $ch = curl_init("https://androidpublisher.googleapis.com/androidpublisher/v3/applications/$packageName/edits/$editId");
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

        $liveVersion = 'None';
        $releaseDate = null;
        if (isset($trackData['releases']) && count($trackData['releases']) > 0) {
            $latestRelease = $trackData['releases'][0];
            $versionCodes = implode(', ', $latestRelease['versionCodes'] ?? ['?']);
            $releaseName = $latestRelease['name'] ?? '';
            $liveVersion = $releaseName ? "$releaseName ($versionCodes)" : $versionCodes;

            // Extract release time if available
            if (isset($latestRelease['releaseTime'])) {
                $releaseDate = date('M d, Y', strtotime($latestRelease['releaseTime']));
            }
        }

        echo json_encode([
            "status" => "success",
            "live_version" => $liveVersion,
            "release_date" => $releaseDate
        ]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Fetch all archived artifacts for File Explorer
 */
function getAllArchives($pdo)
{
    try {
        if (!$pdo)
            throw new Exception("Database connection failed");
        $stmt = $pdo->query("SELECT * FROM app_artifacts WHERE is_latest = 0 ORDER BY archived_at DESC, created_at DESC");
        echo json_encode($stmt->fetchAll());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to fetch archives", "error" => $e->getMessage()]);
    }
}

/**
 * Restore an archived file to Latest status
 */
function restoreApp($pdo) {
    try {
        $id = $_POST['id'] ?? null;
        if (!$id) throw new Exception("ID required");

        // 1. Get info about the record we are restoring
        $stmt = $pdo->prepare("SELECT * FROM app_artifacts WHERE id = ?");
        $stmt->execute([$id]);
        $app = $stmt->fetch();
        if (!$app) throw new Exception("File not found");

        $pdo->beginTransaction();

        // 2. Mark current latest as archived
        $stmt = $pdo->prepare("UPDATE app_artifacts SET is_latest = 0, archive_status = 'archived', archived_at = NOW() 
                              WHERE company = ? AND platform = ? AND app_type = ? AND is_latest = 1");
        $stmt->execute([$app['company'], $app['platform'], $app['app_type']]);

        // 3. Mark this one as latest
        $stmt = $pdo->prepare("UPDATE app_artifacts SET is_latest = 1, archive_status = 'active', archived_at = NULL WHERE id = ?");
        $stmt->execute([$id]);

        $pdo->commit();
        echo json_encode(["message" => "File restored to Latest repository"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Restore failed", "error" => $e->getMessage()]);
    }
}

/**
 * List files inside a ZIP archive
 */
function getZipContents($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) throw new Exception("ID required");

        $stmt = $pdo->prepare("SELECT binary_file_name FROM app_artifacts WHERE id = ?");
        $stmt->execute([$id]);
        $app = $stmt->fetch();
        if (!$app) throw new Exception("File not found");

        $filePath = __DIR__ . '/../storage/apps/' . $app['binary_file_name'];
        if (!file_exists($filePath)) throw new Exception("Physical file not found at " . $filePath);

        $zip = new ZipArchive;
        if ($zip->open($filePath) === TRUE) {
            $files = [];
            $numFiles = $zip->numFiles;
            // Limit to first 1000 files for performance if it's a massive archive
            for ($i = 0; $i < $numFiles; $i++) {
                if ($i > 1000) break; // Performance Limit
                $name = $zip->getNameIndex($i);
                $files[] = [
                    'name' => $name,
                    'size' => 0 // getNameIndex is significantly faster than statIndex
                ];
            }
            $zip->close();
            echo json_encode($files);
        } else {
            throw new Exception("Failed to open ZIP archive (possibly corrupt)");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to read ZIP", "error" => $e->getMessage()]);
    }
}
