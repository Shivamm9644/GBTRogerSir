<?php

class Database
{
    // ── Update these to match your MySQL setup ──
    private string $host = "localhost";
    private string $db_name = "gbt_dashboard";
    private string $username = "root";
    private string $password = "";      // XAMPP default has no password
    private string $charset = "utf8mb4";

    public ?PDO $conn = null;

    public function getConnection(): ?PDO
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
