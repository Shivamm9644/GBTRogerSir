<?php
header('Content-Type: application/json');

$base = dirname(__DIR__);  // gbtbackend/ folder
$uploadDir = __DIR__ . '/../storage/apps/';
$logsDir = __DIR__ . '/../../logs/';

// Try to create dirs if missing
if (!is_dir($uploadDir))
    @mkdir($uploadDir, 0777, true);
if (!is_dir($logsDir))
    @mkdir($logsDir, 0777, true);

echo json_encode([
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'script_dir' => __DIR__,
    'upload_dir_path' => realpath($uploadDir) ?: $uploadDir . ' (NOT FOUND)',
    'upload_dir_exists' => is_dir($uploadDir),
    'upload_dir_writable' => is_writable($uploadDir),
    'logs_dir_path' => realpath($logsDir) ?: $logsDir . ' (NOT FOUND)',
    'logs_dir_exists' => is_dir($logsDir),
    'logs_dir_writable' => is_writable($logsDir),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'memory_limit' => ini_get('memory_limit'),
    'zip_enabled' => class_exists('ZipArchive'),
    'mysqli_enabled' => extension_loaded('mysqli'),
], JSON_PRETTY_PRINT);