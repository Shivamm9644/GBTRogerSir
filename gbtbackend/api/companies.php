<?php


ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
// ── CORS Headers ─────────────────────────────────────────────────────────────
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure companies table exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        package_name VARCHAR(255),
        owner_name VARCHAR(255) NOT NULL,
        owner_mobile VARCHAR(50) NOT NULL,
        owner_email VARCHAR(255) NOT NULL,
        address TEXT,
        admin_url VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Final Seeding Logic: Ensure all 3 production companies exist
    $seeds = [
        ['SAMI ELD', 'Premium', 'Sami', '9876543210', 'sami@eld.com', 'USA', 'https://samield.com'],
        ['Allstar Logistics', 'Standard', 'John Allstar', '1234567890', 'contact@allstar.com', 'Chicago, IL', 'https://admin.allstarelogs.com'],
        ['Trucker Terrace', 'Enterprise', 'Mike Trucker', '5550123456', 'info@truckerterrace.com', 'Dallas, TX', 'https://admin.truckertraceeld.com']
    ];

    foreach ($seeds as $s) {
        // Use a more inclusive search for the name
        $name = $s[0];
        $searchName = '%' . explode(' ', $name)[0] . '%'; // e.g., 'Allstar', 'Trucker', 'SAMI'
        
        $stmt = $db->prepare("SELECT id FROM companies WHERE company_name LIKE ?");
        $stmt->execute([$searchName]);
        $existing = $stmt->fetch();

        if (!$existing) {
            // Not found at all - INSERT
            $ins = $db->prepare("INSERT INTO companies (company_name, package_name, owner_name, owner_mobile, owner_email, address, admin_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $ins->execute($s);
        } else {
            // Found - UPDATE URL to make sure it's the live production one
            $upd = $db->prepare("UPDATE companies SET admin_url = ? WHERE id = ?");
            $upd->execute([$s[6], $existing['id']]);
        }
    }
} catch (Exception $e) {
    // Ignore if it fails due to permissions, etc.
}

// ── Route Handlers ─────────────────────────────────────────────────────────────
try {
    switch ($method) {

        // ── GET: List all companies ──────────────────────────────────────────────
        case 'GET':
            $query = "SELECT * FROM companies ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $companies = $stmt->fetchAll();

            echo json_encode([
                "status" => "success",
                "count" => count($companies),
                "data" => $companies
            ]);
            break;

        // ── POST: Create new company ─────────────────────────────────────────────
        case 'POST':
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);

            if (!$data) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Invalid or empty JSON body"]);
                exit();
            }

            // Validate required fields
            $required = ['company_name', 'owner_name', 'owner_mobile', 'owner_email', 'admin_url'];
            foreach ($required as $field) {
                if (empty(trim($data[$field] ?? ''))) {
                    http_response_code(422);
                    echo json_encode(["status" => "error", "message" => "Field '{$field}' is required"]);
                    exit();
                }
            }

            // Basic email validation
            if (!filter_var($data['owner_email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(422);
                echo json_encode(["status" => "error", "message" => "Invalid email address"]);
                exit();
            }

            // Auto-prepend https:// if missing
            $adminUrl = trim($data['admin_url']);
            if (!empty($adminUrl) && !preg_match('~^(?:f|ht)tps?://~i', $adminUrl)) {
                $adminUrl = "https://" . $adminUrl;
            }

            $query = "INSERT INTO companies
                    (company_name, package_name, owner_name, owner_mobile, owner_email, address, admin_url)
                  VALUES
                    (:company_name, :package_name, :owner_name, :owner_mobile, :owner_email, :address, :admin_url)";

            $stmt = $db->prepare($query);
            $stmt->bindValue(':company_name', trim($data['company_name']));
            $stmt->bindValue(':package_name', trim($data['package_name'] ?? ''));
            $stmt->bindValue(':owner_name', trim($data['owner_name']));
            $stmt->bindValue(':owner_mobile', trim($data['owner_mobile']));
            $stmt->bindValue(':owner_email', trim($data['owner_email']));
            $stmt->bindValue(':address', trim($data['address'] ?? ''));
            $stmt->bindValue(':admin_url', rtrim($adminUrl, '/'));

            if ($stmt->execute()) {
                $newId = $db->lastInsertId();

                // Return the newly created record
                $fetch = $db->prepare("SELECT * FROM companies WHERE id = ?");
                $fetch->execute([$newId]);
                $newCompany = $fetch->fetch();

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "message" => "Company created successfully",
                    "data" => $newCompany
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Failed to create company"]);
            }
            break;

        // ── PUT: Update a company ─────────────────────────────────────────────
        case 'PUT':
            $id = intval($_GET['id'] ?? 0);
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Valid company ID is required']);
                exit();
            }

            if (!$data) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid or empty JSON body']);
                exit();
            }

            $required = ['company_name', 'owner_name', 'owner_mobile', 'owner_email', 'admin_url'];
            foreach ($required as $field) {
                if (empty(trim($data[$field] ?? ''))) {
                    http_response_code(422);
                    echo json_encode(['status' => 'error', 'message' => "Field '{$field}' is required"]);
                    exit();
                }
            }

            $adminUrl = trim($data['admin_url']);
            if (!empty($adminUrl) && !preg_match('~^(?:f|ht)tps?://~i', $adminUrl)) {
                $adminUrl = "https://" . $adminUrl;
            }

            $query = 'UPDATE companies SET
                    company_name = :company_name,
                    package_name = :package_name,
                    owner_name   = :owner_name,
                    owner_mobile = :owner_mobile,
                    owner_email  = :owner_email,
                    address      = :address,
                    admin_url    = :admin_url
                  WHERE id = :id';

            $stmt = $db->prepare($query);
            $stmt->bindValue(':company_name', trim($data['company_name']));
            $stmt->bindValue(':package_name', trim($data['package_name'] ?? ''));
            $stmt->bindValue(':owner_name', trim($data['owner_name']));
            $stmt->bindValue(':owner_mobile', trim($data['owner_mobile']));
            $stmt->bindValue(':owner_email', trim($data['owner_email']));
            $stmt->bindValue(':address', trim($data['address'] ?? ''));
            $stmt->bindValue(':admin_url', rtrim($adminUrl, '/'));
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                if ($stmt->rowCount() >= 0) { // Changed back to >= 0 to allow updates with no changes
                    $fetch = $db->prepare('SELECT * FROM companies WHERE id = ?');
                    $fetch->execute([$id]);
                    echo json_encode(['status' => 'success', 'message' => 'Company updated', 'data' => $fetch->fetch()]);
                } else {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'Company not found']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to update company']);
            }

            break;

        // ── DELETE: Remove a company ─────────────────────────────────────────────
        case 'DELETE':
            $id = intval($_GET['id'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Valid company ID is required"]);
                exit();
            }

            $stmt = $db->prepare("DELETE FROM companies WHERE id = ?");
            if ($stmt->execute([$id])) {
                if ($stmt->rowCount() > 0) {
                    echo json_encode(["status" => "success", "message" => "Company deleted"]);
                } else {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "message" => "Company not found"]);
                }
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Failed to delete company"]);
            }
            break;

        // ── Method Not Allowed ───────────────────────────────────────────────────
        default:
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    }
} catch (PDOException $e) {
    $error = "Database error: " . $e->getMessage();
    file_put_contents('error_log.txt', date('[Y-m-d H:i:s] ') . $error . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $error]);
} catch (Exception $e) {
    $error = "Server error: " . $e->getMessage();
    file_put_contents('error_log.txt', date('[Y-m-d H:i:s] ') . $error . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $error]);
}
