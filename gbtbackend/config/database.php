<?php

class Database
{
    // ── Update these to match your MySQL setup ──
    public $host = "localhost";
    public $db_name = "lmhaiss_app4";
    public $username = "lmhaiss_app4";
    public $password = "tedzZXe4EsSptezVsH7z";
    public $charset = "utf8mb4";

    public $conn = null;

    public function getConnection()
    {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Database connection failed: " . $e->getMessage()
            ]);
            exit();
        }
        return $this->conn;
    }
}
