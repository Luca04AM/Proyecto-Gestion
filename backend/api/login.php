<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

if ($method !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido. Use POST."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$correo = $data["correo"] ?? "";
$password = $data["password"] ?? "";

if (empty($correo) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Correo y contraseña son obligatorios."
    ]);
    exit;
}

try {
    $sql = "SELECT id, nombre, correo, password, estado 
            FROM usuarios 
            WHERE correo = :correo";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":correo", $correo);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "El usuario no existe."
        ]);
        exit;
    }

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario["estado"] !== "Activo") {
        echo json_encode([
            "success" => false,
            "message" => "El usuario está inactivo."
        ]);
        exit;
    }

    if (!password_verify($password, $usuario["password"])) {
        echo json_encode([
            "success" => false,
            "message" => "Contraseña incorrecta."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Inicio de sesión correcto.",
        "usuario" => [
            "id" => $usuario["id"],
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "estado" => $usuario["estado"]
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error al iniciar sesión.",
        "error" => $e->getMessage()
    ]);
}