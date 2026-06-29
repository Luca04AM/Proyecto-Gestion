<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

/* ==========================
   LISTAR USUARIOS
   GET /api/usuario.php
========================== */

if ($method === "GET") {

    try {
        $sql = "SELECT id, nombre, correo, estado, fecha_registro 
                FROM usuarios 
                ORDER BY nombre";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $usuarios
        ], JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
        echo json_encode([
            "success" => false,
            "message" => "Error al obtener usuarios.",
            "error" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }

    exit;
}

/* ==========================
   ACTUALIZAR USUARIOS
   PUT /api/usuario.php
========================== */

if ($method === "PUT") {

    $data = json_decode(file_get_contents("php://input"), true);

    $accion = $data["accion"] ?? "";

    /* ==========================
       EDITAR USUARIO
    ========================== */

    if ($accion === "editar") {

        $id = $data["id"] ?? "";
        $nombre = trim($data["nombre"] ?? "");
        $correo = trim($data["correo"] ?? "");
        $estado = $data["estado"] ?? "";

        if (empty($id) || empty($nombre) || empty($correo) || empty($estado)) {
            echo json_encode([
                "success" => false,
                "message" => "Todos los campos son obligatorios."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            echo json_encode([
                "success" => false,
                "message" => "El correo no tiene un formato válido."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($estado !== "Activo" && $estado !== "Inactivo") {
            echo json_encode([
                "success" => false,
                "message" => "Estado inválido."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $sqlVerificar = "SELECT id 
                             FROM usuarios 
                             WHERE correo = :correo 
                             AND id != :id";

            $stmtVerificar = $pdo->prepare($sqlVerificar);
            $stmtVerificar->bindParam(":correo", $correo);
            $stmtVerificar->bindParam(":id", $id);
            $stmtVerificar->execute();

            if ($stmtVerificar->rowCount() > 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "Ese correo ya está registrado por otro usuario."
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $sql = "UPDATE usuarios
                    SET nombre = :nombre,
                        correo = :correo,
                        estado = :estado
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(":nombre", $nombre);
            $stmt->bindParam(":correo", $correo);
            $stmt->bindParam(":estado", $estado);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            echo json_encode([
                "success" => true,
                "message" => "Usuario actualizado correctamente."
            ], JSON_UNESCAPED_UNICODE);
            exit;

        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Error al actualizar usuario.",
                "error" => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    /* ==========================
       CAMBIAR ESTADO
    ========================== */

    if ($accion === "cambiarEstado") {

        $id = $data["id"] ?? "";
        $estado = $data["estado"] ?? "";

        if (empty($id) || empty($estado)) {
            echo json_encode([
                "success" => false,
                "message" => "El id y el estado son obligatorios."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($estado !== "Activo" && $estado !== "Inactivo") {
            echo json_encode([
                "success" => false,
                "message" => "Estado inválido."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $sql = "UPDATE usuarios 
                    SET estado = :estado 
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(":estado", $estado);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            echo json_encode([
                "success" => true,
                "message" => "Estado del usuario actualizado correctamente."
            ], JSON_UNESCAPED_UNICODE);
            exit;

        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Error al cambiar el estado.",
                "error" => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    /* ==========================
       CAMBIAR CONTRASEÑA
    ========================== */

    if ($accion === "cambiarPassword") {

        $id = $data["id"] ?? "";
        $passwordActual = $data["password_actual"] ?? "";
        $passwordNueva = $data["password_nueva"] ?? "";

        if (empty($id) || empty($passwordActual) || empty($passwordNueva)) {
            echo json_encode([
                "success" => false,
                "message" => "Todos los campos son obligatorios."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (strlen($passwordNueva) < 6) {
            echo json_encode([
                "success" => false,
                "message" => "La nueva contraseña debe tener mínimo 6 caracteres."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $sql = "SELECT id, password 
                    FROM usuarios 
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                echo json_encode([
                    "success" => false,
                    "message" => "Usuario no encontrado."
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if (!password_verify($passwordActual, $usuario["password"])) {
                echo json_encode([
                    "success" => false,
                    "message" => "La contraseña actual es incorrecta."
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $passwordEncriptada = password_hash($passwordNueva, PASSWORD_DEFAULT);

            $sqlActualizar = "UPDATE usuarios
                              SET password = :password,
                                  token_recuperacion = NULL
                              WHERE id = :id";

            $stmtActualizar = $pdo->prepare($sqlActualizar);
            $stmtActualizar->bindParam(":password", $passwordEncriptada);
            $stmtActualizar->bindParam(":id", $id);
            $stmtActualizar->execute();

            echo json_encode([
                "success" => true,
                "message" => "Contraseña actualizada correctamente."
            ], JSON_UNESCAPED_UNICODE);
            exit;

        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Error al cambiar la contraseña.",
                "error" => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    echo json_encode([
        "success" => false,
        "message" => "Acción no válida."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================
   REGISTRAR USUARIO
   POST /api/usuario.php
========================== */

if ($method !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido. Use POST, GET o PUT."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$nombre = trim($data["nombre"] ?? "");
$correo = trim($data["correo"] ?? "");
$password = trim($data["password"] ?? "");

if (empty($nombre) || empty($correo) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Todos los campos son obligatorios."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "El correo no tiene un formato válido."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener mínimo 6 caracteres."
    ], JSON_UNESCAPED_UNICODE);
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
        ], JSON_UNESCAPED_UNICODE);
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
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error al registrar usuario.",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}