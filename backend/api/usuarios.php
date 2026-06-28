<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {

    $sql = "SELECT id, nombre, correo FROM usuarios ORDER BY nombre";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $usuarios
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($method !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido. Use POST."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$nombre = $data["nombre"] ?? "";
$correo = $data["correo"] ?? "";
$password = $data["password"] ?? "";

if (empty($nombre) || empty($correo) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Todos los campos son obligatorios."
    ]);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "El correo no tiene un formato válido."
    ]);
    exit;
}

try {
    $sqlVerificar = "SELECT id FROM usuarios WHERE correo = :correo";
    $stmtVerificar = $pdo->prepare($sqlVerificar);
    $stmtVerificar->bindParam(":correo", $correo);
    $stmtVerificar->execute();

    if ($stmtVerificar->rowCount() > 0) {
        echo json_encode([
            "success" => false,
            "message" => "El correo ya está registrado."
        ]);
        exit;
    }

    $passwordEncriptada = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO usuarios 
            (nombre, correo, password, estado, fecha_registro) 
            VALUES 
            (:nombre, :correo, :password, 'Activo', NOW())";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":nombre", $nombre);
    $stmt->bindParam(":correo", $correo);
    $stmt->bindParam(":password", $passwordEncriptada);
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "Usuario registrado correctamente."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error al registrar usuario.",
        "error" => $e->getMessage()
    ]);
}