<?php

require_once "../config/headers.php";
require_once "../config/database.php";

function responderGenero($success, $message = "", $data = null, $status = 200)
{
    http_response_code($status);
    $response = ["success" => $success];

    if ($message !== "") {
        $response["message"] = $message;
    }

    if ($data !== null) {
        $response["data"] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

function leerEntradaGenero()
{
    $data = json_decode(file_get_contents("php://input"), true);
    return is_array($data) ? $data : $_POST;
}

function validarGenero($data)
{
    $nombre = trim($data["nombre"] ?? "");
    $descripcion = trim($data["descripcion"] ?? "");
    $estado = trim($data["estado"] ?? "Activo");

    if ($nombre === "" || $descripcion === "") {
        responderGenero(false, "El nombre y la descripción son obligatorios.", null, 400);
    }

    if (!in_array($estado, ["Activo", "Inactivo"], true)) {
        responderGenero(false, "El estado indicado no es válido.", null, 400);
    }

    return [$nombre, $descripcion, $estado];
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $id = isset($_GET["id"]) ? (int) $_GET["id"] : 0;
        $buscar = trim($_GET["buscar"] ?? "");

        if ($id > 0) {
            $stmt = $pdo->prepare("SELECT id, nombre, descripcion, estado, fecha_registro FROM generos WHERE id = :id");
            $stmt->execute([":id" => $id]);
            $genero = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$genero) {
                responderGenero(false, "El género no existe.", null, 404);
            }

            responderGenero(true, "", $genero);
        }

        if ($buscar !== "") {
            $stmt = $pdo->prepare(
                "SELECT id, nombre, descripcion, estado, fecha_registro
                 FROM generos
                 WHERE nombre LIKE :buscar OR descripcion LIKE :buscar
                 ORDER BY nombre ASC"
            );
            $stmt->execute([":buscar" => "%" . $buscar . "%"]);
        } else {
            $stmt = $pdo->query(
                "SELECT id, nombre, descripcion, estado, fecha_registro
                 FROM generos
                 ORDER BY nombre ASC"
            );
        }

        responderGenero(true, "", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($method === "POST") {
        $data = leerEntradaGenero();
        [$nombre, $descripcion, $estado] = validarGenero($data);

        $duplicado = $pdo->prepare("SELECT id FROM generos WHERE nombre = :nombre");
        $duplicado->execute([":nombre" => $nombre]);

        if ($duplicado->fetch()) {
            responderGenero(false, "Ya existe un género con ese nombre.", null, 409);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO generos (nombre, descripcion, estado)
             VALUES (:nombre, :descripcion, :estado)"
        );
        $stmt->execute([
            ":nombre" => $nombre,
            ":descripcion" => $descripcion,
            ":estado" => $estado
        ]);

        responderGenero(true, "Género registrado correctamente.", ["id" => $pdo->lastInsertId()], 201);
    }

    if ($method === "PUT") {
        $data = leerEntradaGenero();
        $id = (int) ($data["id"] ?? 0);

        if ($id <= 0) {
            responderGenero(false, "El id del género es obligatorio.", null, 400);
        }

        [$nombre, $descripcion, $estado] = validarGenero($data);

        $existe = $pdo->prepare("SELECT id FROM generos WHERE id = :id");
        $existe->execute([":id" => $id]);

        if (!$existe->fetch()) {
            responderGenero(false, "El género que desea editar no existe.", null, 404);
        }

        $duplicado = $pdo->prepare("SELECT id FROM generos WHERE nombre = :nombre AND id <> :id");
        $duplicado->execute([":nombre" => $nombre, ":id" => $id]);

        if ($duplicado->fetch()) {
            responderGenero(false, "Ya existe otro género con ese nombre.", null, 409);
        }

        $stmt = $pdo->prepare(
            "UPDATE generos
             SET nombre = :nombre, descripcion = :descripcion, estado = :estado
             WHERE id = :id"
        );
        $stmt->execute([
            ":id" => $id,
            ":nombre" => $nombre,
            ":descripcion" => $descripcion,
            ":estado" => $estado
        ]);

        responderGenero(true, "Género actualizado correctamente.");
    }

    if ($method === "DELETE") {
        $data = leerEntradaGenero();
        $id = isset($_GET["id"]) ? (int) $_GET["id"] : (int) ($data["id"] ?? 0);

        if ($id <= 0) {
            responderGenero(false, "El id del género es obligatorio.", null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM generos WHERE id = :id");
        $stmt->execute([":id" => $id]);

        if ($stmt->rowCount() === 0) {
            responderGenero(false, "El género que desea eliminar no existe.", null, 404);
        }

        responderGenero(true, "Género eliminado correctamente.");
    }

    responderGenero(false, "Método no permitido.", null, 405);
} catch (PDOException $e) {
    $status = $e->getCode() === "23000" ? 409 : 500;
    responderGenero(false, $status === 409
        ? "No se puede completar la operación porque el género está relacionado con otros datos."
        : "Ocurrió un error al procesar los géneros.", null, $status);
}
