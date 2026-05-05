<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    "status"  => "ok",
    "message" => "GBT Dashboard API is running",
    "version" => "1.0.0"
]);
