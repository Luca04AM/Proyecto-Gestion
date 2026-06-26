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

if (empty($correo)) {
    echo json_encode([
        "success" => false,
        "message" => "El correo es obligatorio."
    ]);
    exit;
}

try {
    $sql = "SELECT id, nombre, correo 
            FROM usuarios 
            WHERE correo = :correo";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":correo", $correo);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "No existe un usuario con ese correo."
        ]);
        exit;
    }

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $token = bin2hex(random_bytes(32));

    $sqlActualizar = "UPDATE usuarios 
                      SET token_recuperacion = :token 
                      WHERE id = :id";

    $stmtActualizar = $pdo->prepare($sqlActualizar);
    $stmtActualizar->bindParam(":token", $token);
    $stmtActualizar->bindParam(":id", $usuario["id"]);
    $stmtActualizar->execute();

    echo json_encode([
        "success" => true,
        "message" => "Token de recuperación generado correctamente.",
        "token" => $token
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error al solicitar recuperación.",
        "error" => $e->getMessage()
    ]);
}