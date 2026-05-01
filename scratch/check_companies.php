<?php
include_once 'backend/config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->query("SELECT id, company_name, package_name FROM companies");
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($results, JSON_PRETTY_PRINT);
