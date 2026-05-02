<?php
require_once 'db.php';
$res = $conn->query("SELECT * FROM apps LIMIT 20");
$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
}
echo json_encode($rows);
