<?php

$host = "127.0.0.1";
$port = "3307";
$dbname = "ProyectoGestion";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión: " . $e->getMessage()
    ]);
    exit;
}
