<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Performance & Upload Settings for Production
ini_set('upload_max_filesize', '512M');
ini_set('post_max_size', '512M');
ini_set('memory_limit', '512M');
ini_set('max_execution_time', '600');
ini_set('max_input_time', '600');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/db.php';

$cmd = $_GET['cmd'] ?? $_POST['cmd'] ?? '';

$rawInput = file_get_contents("php://input");
$jsonInput = json_decode($rawInput, true);

if (!$cmd && isset($jsonInput['cmd'])) {
    $cmd = $jsonInput['cmd'];
}

/**
 * GET ALL ROOT FILES/FOLDERS
 */
if ($cmd === 'get_all_archives') {
    $sql = "
        SELECT *
        FROM apps
        WHERE parent_id IS NULL OR parent_id = 0
        ORDER BY binary_file_ext = 'folder' DESC, id DESC
    ";

    $result = $conn->query($sql);

    $items = [];

    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }

    echo json_encode($items);
    exit;
}

/**
 * GET FOLDER ITEMS
 */
if ($cmd === 'get_folder_items') {
    $folderId = intval($_GET['folder_id'] ?? 0);

    $stmt = $conn->prepare("
        SELECT *
        FROM apps
        WHERE parent_id = ?
        ORDER BY binary_file_ext = 'folder' DESC, id DESC
    ");

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

/**
 * CREATE FOLDER
 */
if ($cmd === 'create_folder') {
    $name = trim($jsonInput['name'] ?? $_POST['name'] ?? '');
    $parentId = $jsonInput['parent_id'] ?? $_POST['parent_id'] ?? null;

    if ($name === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Folder name required"]);
        exit;
    }

    if ($parentId === '' || $parentId === null) {
        $parentId = 0;
    }

    $ext = 'folder';
    $company = 'Manual Folder';
    $createdAt = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("
        INSERT INTO apps
        (company, binary_file_name, binary_file_ext, parent_id, created_at)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->bind_param("sssis", $company, $name, $ext, $parentId, $createdAt);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
        exit;
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => $stmt->error]);
    exit;
}

/**
 * UPLOAD FILE
 */
if ($cmd === 'save_app') {
    if (!isset($_FILES['binary'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "No file uploaded"]);
        exit;
    }

    $file = $_FILES['binary'];
    $parentId = $_POST['folder_id'] ?? 0;
    $company = $_POST['company'] ?? 'Manual Archive';

    $originalName = basename($file['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    $allowed = ['zip', 'apk', 'ipa'];

    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid file type"]);
        exit;
    }

    $uploadDir = __DIR__ . '/../storage/apps/';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $safeName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
    $targetPath = $uploadDir . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "File upload failed"]);
        exit;
    }

    $createdAt = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("
        INSERT INTO apps
        (company, binary_file_name, binary_file_ext, parent_id, created_at)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->bind_param("sssis", $company, $safeName, $ext, $parentId, $createdAt);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
        exit;
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => $stmt->error]);
    exit;
}

/**
 * WINDOWS FILE EXPLORER STYLE ZIP BROWSING
 * Only current folder items return karega.
 */
if ($cmd === 'get_zip_contents') {
    $id = intval($_GET['id'] ?? 0);
    $currentPath = $_GET['path'] ?? '';

    $currentPath = str_replace('\\', '/', $currentPath);
    $currentPath = ltrim($currentPath, '/');

    if ($currentPath !== '' && substr($currentPath, -1) !== '/') {
        $currentPath .= '/';
    }

    $stmt = $conn->prepare("
        SELECT binary_file_name
        FROM apps
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    $fileRow = $result->fetch_assoc();

    if (!$fileRow) {
        echo json_encode([]);
        exit;
    }

    $zipPath = __DIR__ . '/../storage/apps/' . $fileRow['binary_file_name'];

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
                $zipFiles[] = [
                    'name' => str_replace('\\', '/', $stat['name']),
                    'size' => $stat['size']
                ];
            }
            $zip->close();
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Unable to open ZIP. Error: " . $res]);
            exit;
        }
    } else {
        if (PHP_OS_FAMILY === 'Windows') {
            // FALLBACK: Use PowerShell to list ZIP contents if ZipArchive is missing
            $safeZipPath = str_replace("'", "''", $zipPath);
            $psCommand = "powershell -NoProfile -Command \"Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('$safeZipPath').Entries | ForEach-Object { @{ name = \$_.FullName; size = \$_.Length } | ConvertTo-Json -Compress }\"";
            
            exec($psCommand, $output, $returnCode);
            
            if ($returnCode === 0) {
                foreach ($output as $line) {
                    $item = json_decode($line, true);
                    if ($item) {
                        $zipFiles[] = [
                            'name' => str_replace('\\', '/', $item['name']),
                            'size' => $item['size']
                        ];
                    }
                }
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "PHP ZipArchive is disabled AND PowerShell fallback failed."]);
                exit;
            }
        } else {
            // LINUX FALLBACK: Use 'unzip -l'
            exec("unzip -l " . escapeshellarg($zipPath), $output, $returnCode);
            if ($returnCode === 0) {
                foreach ($output as $line) {
                    $line = trim($line);
                    // Standard unzip -l line: "  Length      Date    Time    Name"
                    if (preg_match('/^\s*(\d+)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.*)$/', $line, $matches)) {
                        $zipFiles[] = [
                            'name' => $matches[2],
                            'size' => intval($matches[1])
                        ];
                    }
                }
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "PHP ZipArchive disabled AND Linux 'unzip' fallback failed."]);
                exit;
            }
        }
    }

    $folders = [];
    $files = [];

    foreach ($zipFiles as $stat) {
        $entry = ltrim($stat['name'], '/');

        if ($entry === '' || $entry === $currentPath) {
            continue;
        }

        if ($currentPath !== '') {
            if (strpos($entry, $currentPath) !== 0) {
                continue;
            }
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
                $folders[$folderPath] = [
                    "name" => $first,
                    "path" => $folderPath,
                    "isDir" => true,
                    "size" => 0
                ];
            }
        } else {
            if (substr($entry, -1) === '/') {
                $folderPath = $currentPath . $first . '/';
                if (!isset($folders[$folderPath])) {
                    $folders[$folderPath] = [
                        "name" => $first,
                        "path" => $folderPath,
                        "isDir" => true,
                        "size" => 0
                    ];
                }
            } else {
                $files[] = [
                    "name" => $first,
                    "path" => $entry,
                    "isDir" => false,
                    "size" => $stat['size']
                ];
            }
        }
    }

    $response = array_merge(array_values($folders), $files);

    usort($response, function ($a, $b) {
        if ($a['isDir'] !== $b['isDir']) {
            return $a['isDir'] ? -1 : 1;
        }

        return strcasecmp($a['name'], $b['name']);
    });

    echo json_encode($response);
    exit;
}

http_response_code(400);
echo json_encode([
    "success" => false,
    "message" => "Invalid command"
]);