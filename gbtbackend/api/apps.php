<?php
set_exception_handler(function ($e) {
    ob_clean();
    http_response_code(500);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
    exit;
});

ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

$logFile = __DIR__ . '/../logs/api_debug.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    @mkdir($logDir, 0777, true);
}
if (is_dir($logDir) && is_writable($logDir)) {
    $reqCmd = isset($_REQUEST['cmd']) ? $_REQUEST['cmd'] : 'none';
    $logMsg = "[" . date('Y-m-d H:i:s') . "] " . $_SERVER['REQUEST_METHOD'] . " cmd=" . $reqCmd . "\n";
    @file_put_contents($logFile, $logMsg, FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db_host = "localhost";
    $db_name = "lmhaiss_app4";
    $db_user = "lmhaiss_app4";
    $db_pass = "tedzZXe4EsSptezVsH7z";

    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");

    // Ensure table exists for File Explorer
    $conn->query("CREATE TABLE IF NOT EXISTS apps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company VARCHAR(255) DEFAULT 'Manual Archive',
        binary_file_name VARCHAR(255) NOT NULL,
        binary_file_ext VARCHAR(50) NOT NULL,
        parent_id INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Ensure app_artifacts table exists for Apps & Firmware Dashboard
    $conn->query("CREATE TABLE IF NOT EXISTS app_artifacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        app_type VARCHAR(100) DEFAULT NULL,
        platform VARCHAR(50) DEFAULT NULL,
        app_version VARCHAR(50) DEFAULT NULL,
        os_version VARCHAR(50) DEFAULT NULL,
        hardware VARCHAR(100) DEFAULT NULL,
        firmware_version VARCHAR(100) DEFAULT NULL,
        artifact_status VARCHAR(50) DEFAULT 'Stable',
        binary_file_name VARCHAR(255) DEFAULT NULL,
        binary_file_ext VARCHAR(10) DEFAULT NULL,
        archive_status VARCHAR(50) DEFAULT 'active',
        dot_cancelled TINYINT(1) DEFAULT 0,
        user_manual VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    try {
        $conn->query("ALTER TABLE app_artifacts ADD COLUMN hardware VARCHAR(100) DEFAULT NULL");
    } catch (Exception $e) {
    }

    try {
        $conn->query("ALTER TABLE app_artifacts ADD COLUMN firmware_version VARCHAR(100) DEFAULT NULL");
    } catch (Exception $e) {
    }

    try {
        $conn->query("ALTER TABLE app_artifacts ADD COLUMN dot_cancelled TINYINT(1) DEFAULT 0");
    } catch (Exception $e) {
    }

    try {
        $conn->query("ALTER TABLE app_artifacts ADD COLUMN user_manual VARCHAR(255) DEFAULT NULL");
    } catch (Exception $e) {
        // Ignore duplicate column error
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    exit;
}

$uploadDir = __DIR__ . '/../storage/apps/';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
}
if (is_dir($uploadDir) && !is_writable($uploadDir)) {
    @chmod($uploadDir, 0777);
}

$cmd = '';
if (isset($_GET['cmd'])) {
    $cmd = $_GET['cmd'];
} elseif (isset($_POST['cmd'])) {
    $cmd = $_POST['cmd'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && empty($_FILES) && empty(file_get_contents("php://input"))) {
    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] FATAL ERROR: POST data is empty.\n", FILE_APPEND);
    http_response_code(413);
    echo json_encode(["success" => false, "status" => "ERROR", "message" => "Server rejected upload. File is too large."]);
    exit;
}

$rawInput = file_get_contents("php://input");
$jsonInput = json_decode($rawInput, true);

if (!$cmd && isset($jsonInput['cmd'])) {
    $cmd = $jsonInput['cmd'];
}

if ($cmd === '' || $cmd === 'get_all_apps') {
    $sql = "SELECT * FROM app_artifacts WHERE archive_status != 'archived' ORDER BY id DESC";
    $result = $conn->query($sql);
    $items = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
    }
    echo json_encode($items);
    exit;
}

if ($cmd === 'get_all_archives') {
    $sql = "SELECT * FROM apps WHERE parent_id IS NULL OR parent_id = 0 ORDER BY binary_file_ext = 'folder' DESC, id DESC";
    $result = $conn->query($sql);
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    echo json_encode($items);
    exit;
}

if ($cmd === 'get_folder_items') {
    $folderId = isset($_GET['folder_id']) ? intval($_GET['folder_id']) : 0;
    $stmt = $conn->prepare("SELECT * FROM apps WHERE parent_id = ? ORDER BY binary_file_ext = 'folder' DESC, id DESC");
    $stmt->bind_param("i", $folderId);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    echo json_encode($items);
    exit;
}

if ($cmd === 'delete') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM app_artifacts WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Artifact deleted"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to delete"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid ID"]);
    }
    exit;
}

if ($cmd === 'archive') {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE app_artifacts SET archive_status = 'archived', archived_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Moved to archive"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to archive"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid ID"]);
    }
    exit;
}

if ($cmd === 'history') {
    $company = isset($_POST['company']) ? $_POST['company'] : '';
    $appType = isset($_POST['app_type']) ? $_POST['app_type'] : '';
    $platform = isset($_POST['platform']) ? $_POST['platform'] : '';

    $stmt = $conn->prepare("SELECT app_version, created_at, platform, artifact_status FROM app_artifacts WHERE company = ? AND app_type = ? AND platform = ? ORDER BY id DESC");
    $stmt->bind_param("sss", $company, $appType, $platform);
    $stmt->execute();
    $result = $stmt->get_result();
    $history = [];
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }
    echo json_encode($history);
    exit;
}

if ($cmd === 'create_folder') {
    $nameInput = isset($jsonInput['name']) ? $jsonInput['name'] : (isset($_POST['name']) ? $_POST['name'] : '');
    $name = trim($nameInput);

    $parentInput = isset($jsonInput['parent_id']) ? $jsonInput['parent_id'] : (isset($_POST['parent_id']) ? $_POST['parent_id'] : null);
    $parentId = $parentInput;

    if ($name === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "status" => "ERROR", "message" => "Folder name required"]);
        exit;
    }

    if ($parentId === '' || $parentId === null) {
        $parentId = 0;
    }

    $ext = 'folder';
    $company = 'Manual Folder';
    $createdAt = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("INSERT INTO apps (company, binary_file_name, binary_file_ext, parent_id, created_at) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssis", $company, $name, $ext, $parentId, $createdAt);

    if ($stmt->execute()) {
        @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] FOLDER CREATED: $name\n", FILE_APPEND);
        echo json_encode(["success" => true, "status" => "SUCCESS"]);
        exit;
    }

    $err = $stmt->error;
    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] FOLDER ERROR: $err\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(["success" => false, "status" => "ERROR", "message" => $err]);
    exit;
}

if ($cmd === 'save_app') {
    $isArtifact = isset($_POST['app_type']) && $_POST['app_type'] !== '';
    $company = isset($_POST['company']) ? trim($_POST['company']) : 'Manual Archive';
    $parentId = isset($_POST['folder_id']) ? intval($_POST['folder_id']) : 0;
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

    $safeName = '';
    $ext = '';

    if (isset($_FILES['binary'])) {
        $file = $_FILES['binary'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errorMsgs = [
                UPLOAD_ERR_INI_SIZE => "The uploaded file exceeds the upload_max_filesize directive in php.ini.",
                UPLOAD_ERR_FORM_SIZE => "The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form.",
                UPLOAD_ERR_PARTIAL => "The uploaded file was only partially uploaded.",
                UPLOAD_ERR_NO_FILE => "No file was uploaded.",
                UPLOAD_ERR_NO_TMP_DIR => "Missing a temporary folder.",
                UPLOAD_ERR_CANT_WRITE => "Failed to write file to disk.",
                UPLOAD_ERR_EXTENSION => "A PHP extension stopped the file upload."
            ];
            $msg = isset($errorMsgs[$file['error']]) ? $errorMsgs[$file['error']] : "Unknown upload error (Code: " . $file['error'] . ")";

            // Ignore NO_FILE if it is an artifact update without a new binary
            if (!($isArtifact && $file['error'] === UPLOAD_ERR_NO_FILE)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => $msg]);
                exit;
            }
        } else {
            $originalName = basename($file['name']);
            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            $allowed = ['zip', 'apk', 'ipa', 'exe', 'bin'];

            if (!in_array($ext, $allowed)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Invalid file type"]);
                exit;
            }

            $safeName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
            $targetPath = $uploadDir . $safeName;

            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                $error = error_get_last();
                $msg = $error ? $error['message'] : "Unknown error moving uploaded file.";
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "File upload failed: " . $msg]);
                exit;
            }
        }
    } else if (!$isArtifact) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "No file received."]);
        exit;
    }

    $createdAt = date('Y-m-d H:i:s');

    if ($isArtifact) {
        $appType = $_POST['app_type'];
        $desc = isset($_POST['description']) ? $_POST['description'] : '';
        $platform = isset($_POST['platform']) ? $_POST['platform'] : '';
        $appVersion = isset($_POST['app_version']) ? $_POST['app_version'] : '';
        $osVersion = isset($_POST['os_version']) ? $_POST['os_version'] : '';
        $hardware = isset($_POST['hardware']) ? $_POST['hardware'] : '';
        $fwVersion = isset($_POST['firmware_version']) ? $_POST['firmware_version'] : '';
        $status = isset($_POST['artifact_status']) ? $_POST['artifact_status'] : 'Stable';
        $dotCancelled = isset($_POST['dot_cancelled']) ? intval($_POST['dot_cancelled']) : 0;

        $userManual = '';
        if (isset($_FILES['user_manual']) && $_FILES['user_manual']['error'] === UPLOAD_ERR_OK) {
            $userManual = time() . '_' . basename($_FILES['user_manual']['name']);
            move_uploaded_file($_FILES['user_manual']['tmp_name'], $uploadDir . $userManual);
        }

        if ($id > 0) {
            if ($safeName && $userManual) {
                $stmt = $conn->prepare("UPDATE app_artifacts SET company=?, description=?, app_type=?, platform=?, app_version=?, os_version=?, hardware=?, firmware_version=?, artifact_status=?, dot_cancelled=?, binary_file_name=?, binary_file_ext=?, user_manual=? WHERE id=?");
                $stmt->bind_param("sssssssssisssi", $company, $desc, $appType, $platform, $appVersion, $osVersion, $hardware, $fwVersion, $status, $dotCancelled, $safeName, $ext, $userManual, $id);
            } else if ($safeName) {
                $stmt = $conn->prepare("UPDATE app_artifacts SET company=?, description=?, app_type=?, platform=?, app_version=?, os_version=?, hardware=?, firmware_version=?, artifact_status=?, dot_cancelled=?, binary_file_name=?, binary_file_ext=? WHERE id=?");
                $stmt->bind_param("sssssssssissi", $company, $desc, $appType, $platform, $appVersion, $osVersion, $hardware, $fwVersion, $status, $dotCancelled, $safeName, $ext, $id);
            } else if ($userManual) {
                $stmt = $conn->prepare("UPDATE app_artifacts SET company=?, description=?, app_type=?, platform=?, app_version=?, os_version=?, hardware=?, firmware_version=?, artifact_status=?, dot_cancelled=?, user_manual=? WHERE id=?");
                $stmt->bind_param("sssssssssisi", $company, $desc, $appType, $platform, $appVersion, $osVersion, $hardware, $fwVersion, $status, $dotCancelled, $userManual, $id);
            } else {
                $stmt = $conn->prepare("UPDATE app_artifacts SET company=?, description=?, app_type=?, platform=?, app_version=?, os_version=?, hardware=?, firmware_version=?, artifact_status=?, dot_cancelled=? WHERE id=?");
                $stmt->bind_param("sssssssssii", $company, $desc, $appType, $platform, $appVersion, $osVersion, $hardware, $fwVersion, $status, $dotCancelled, $id);
            }
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Artifact updated successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => $stmt->error]);
            }
        } else {
            // Auto-archive existing active records for this company & app type
            $archiveStmt = $conn->prepare("UPDATE app_artifacts SET archive_status = 'archived' WHERE company = ? AND app_type = ? AND archive_status != 'archived'");
            $archiveStmt->bind_param("ss", $company, $appType);
            $archiveStmt->execute();

            $stmt = $conn->prepare("INSERT INTO app_artifacts (company, description, app_type, platform, app_version, os_version, hardware, firmware_version, artifact_status, dot_cancelled, binary_file_name, binary_file_ext, user_manual, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssssssissss", $company, $desc, $appType, $platform, $appVersion, $osVersion, $hardware, $fwVersion, $status, $dotCancelled, $safeName, $ext, $userManual, $createdAt);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Artifact saved successfully and previous versions archived.", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => $stmt->error]);
            }
        }
    } else {
        $stmt = $conn->prepare("INSERT INTO apps (company, binary_file_name, binary_file_ext, parent_id, created_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssis", $company, $safeName, $ext, $parentId, $createdAt);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "File saved"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $stmt->error]);
        }
    }
    exit;
}

if ($cmd === 'get_zip_contents') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $currentPath = isset($_GET['path']) ? $_GET['path'] : '';

    $currentPath = str_replace('\\', '/', $currentPath);
    $currentPath = ltrim($currentPath, '/');

    if ($currentPath !== '' && substr($currentPath, -1) !== '/') {
        $currentPath .= '/';
    }

    $stmt = $conn->prepare("SELECT binary_file_name FROM apps WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $fileRow = $result->fetch_assoc();

    if (!$fileRow) {
        echo json_encode([]);
        exit;
    }

    $zipPath = $uploadDir . $fileRow['binary_file_name'];
    if (!file_exists($zipPath)) {
        echo json_encode([]);
        exit;
    }

    $zipFiles = [];
    $isZipEnabled = class_exists('ZipArchive');

    if ($isZipEnabled) {
        $zip = new ZipArchive();
        $res = $zip->open($zipPath);
        if ($res === true) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stat = $zip->statIndex($i);
                $zipFiles[] = ['name' => str_replace('\\', '/', $stat['name']), 'size' => $stat['size']];
            }
            $zip->close();
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Unable to open ZIP. Error: " . $res]);
            exit;
        }
    } else {
        exec("unzip -l " . escapeshellarg($zipPath), $output, $returnCode);
        if ($returnCode === 0) {
            foreach ($output as $line) {
                $line = trim($line);
                if (preg_match('/^\s*(\d+)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.*)$/', $line, $matches)) {
                    $zipFiles[] = ['name' => $matches[2], 'size' => intval($matches[1])];
                }
            }
        }
    }

    $folders = [];
    $files = [];

    foreach ($zipFiles as $stat) {
        $entry = ltrim($stat['name'], '/');
        if ($entry === '' || $entry === $currentPath)
            continue;

        if ($currentPath !== '') {
            if (strpos($entry, $currentPath) !== 0)
                continue;
            $relative = substr($entry, strlen($currentPath));
        } else {
            $relative = $entry;
        }

        if ($relative === '')
            continue;

        $parts = explode('/', $relative);
        $first = $parts[0];
        if ($first === '')
            continue;

        if (count($parts) > 1) {
            $folderPath = $currentPath . $first . '/';
            if (!isset($folders[$folderPath])) {
                $folders[$folderPath] = ["name" => $first, "path" => $folderPath, "isDir" => true, "size" => 0];
            }
        } else {
            if (substr($entry, -1) === '/') {
                $folderPath = $currentPath . $first . '/';
                if (!isset($folders[$folderPath])) {
                    $folders[$folderPath] = ["name" => $first, "path" => $folderPath, "isDir" => true, "size" => 0];
                }
            } else {
                $files[] = ["name" => $first, "path" => $entry, "isDir" => false, "size" => $stat['size']];
            }
        }
    }

    $response = array_merge(array_values($folders), $files);
    usort($response, function ($a, $b) {
        if ($a['isDir'] !== $b['isDir'])
            return $a['isDir'] ? -1 : 1;
        return strcasecmp($a['name'], $b['name']);
    });

    ob_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "message" => "Invalid command"]);
