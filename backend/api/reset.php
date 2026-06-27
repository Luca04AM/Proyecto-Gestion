<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

if ($method !== "PUT") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido. Use PUT."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$token = $data["token"] ?? "";
$password = $data["password"] ?? "";

if (empty($token) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Token y nueva contraseña son obligatorios."
    ]);
    exit;
}

try {
    $sql = "SELECT id 
            FROM usuarios 
            WHERE token_recuperacion = :token";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":token", $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Token inválido o inexistente."
        ]);
        exit;
    }

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $passwordEncriptada = password_hash($password, PASSWORD_DEFAULT);

    $sqlActualizar = "UPDATE usuarios 
                      SET password = :password, 
                          token_recuperacion = NULL 
                      WHERE id = :id";

    $stmtActualizar = $pdo->prepare($sqlActualizar);
    $stmtActualizar->bindParam(":password", $passwordEncriptada);
    $stmtActualizar->bindParam(":id", $usuario["id"]);
    $stmtActualizar->execute();

    echo json_encode([
        "success" => true,
        "message" => "Contraseña restablecida correctamente."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error al restablecer contraseña.",
        "error" => $e->getMessage()
    ]);
}