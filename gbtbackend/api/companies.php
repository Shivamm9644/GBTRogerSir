<?php
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

// ── Route Handlers ─────────────────────────────────────────────────────────────
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

        // Basic URL validation
        if (!filter_var($data['admin_url'], FILTER_VALIDATE_URL)) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "Invalid admin URL"]);
            exit();
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
        $stmt->bindValue(':admin_url', rtrim(trim($data['admin_url']), '/'));

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
        $stmt->bindValue(':admin_url', rtrim(trim($data['admin_url']), '/'));
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
