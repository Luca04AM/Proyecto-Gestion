<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {
    case "GET":
        if (isset($_GET["id"])) {
            obtenerMulta($_GET["id"]);
            break;
        }

        if (isset($_GET["accion"]) && $_GET["accion"] === "catalogos") {
            obtenerCatalogos();
            break;
        }

        listarMultas();
        break;

    case "POST":
        guardarMulta();
        break;

    case "PUT":
        actualizarMulta();
        break;

    default:
        http_response_code(405);
        echo json_encode([
            "success" => false,
            "message" => "Método no permitido"
        ], JSON_UNESCAPED_UNICODE);
        break;
}

function listarMultas()
{
    global $pdo;

    try {
        $sql = "SELECT m.id, m.id_usuario, m.id_libro, m.fecha_devolucion, m.dias_retraso, m.dias_gracia,
                       m.monto, m.estado, m.tipo, u.nombre AS usuario, l.titulo AS libro
                FROM multas m
                INNER JOIN usuarios u ON u.id = m.id_usuario
                INNER JOIN libros l ON l.id = m.id_libro
                ORDER BY m.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function obtenerMulta($id)
{
    global $pdo;

    try {
        $sql = "SELECT m.id, m.id_usuario, m.id_libro, m.fecha_devolucion, m.dias_retraso, m.dias_gracia,
                       m.monto, m.estado, m.tipo, u.nombre AS usuario, l.titulo AS libro
                FROM multas m
                INNER JOIN usuarios u ON u.id = m.id_usuario
                INNER JOIN libros l ON l.id = m.id_libro
                WHERE m.id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "data" => $stmt->fetch(PDO::FETCH_ASSOC)
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function obtenerCatalogos()
{
    global $pdo;

    try {
        $sqlUsuarios = "SELECT id, nombre FROM usuarios WHERE estado = 'Activo' ORDER BY nombre ASC";
        $stmtUsuarios = $pdo->prepare($sqlUsuarios);
        $stmtUsuarios->execute();

        $sqlLibros = "SELECT id, titulo FROM libros ORDER BY titulo ASC";
        $stmtLibros = $pdo->prepare($sqlLibros);
        $stmtLibros->execute();

        echo json_encode([
            "success" => true,
            "data" => [
                "usuarios" => $stmtUsuarios->fetchAll(PDO::FETCH_ASSOC),
                "libros" => $stmtLibros->fetchAll(PDO::FETCH_ASSOC)
            ]
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function guardarMulta()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        $data = $_POST;
    }

    $id_usuario = isset($data["id_usuario"]) ? intval($data["id_usuario"]) : 0;
    $id_libro = isset($data["id_libro"]) ? intval($data["id_libro"]) : 0;
    $fecha_devolucion = isset($data["fecha_devolucion"]) ? trim($data["fecha_devolucion"]) : "";
    $dias_retraso = isset($data["dias_retraso"]) ? intval($data["dias_retraso"]) : 0;
    $dias_gracia = isset($data["dias_gracia"]) ? intval($data["dias_gracia"]) : 0;
    $monto = isset($data["monto"]) ? floatval($data["monto"]) : 0;
    $estado = isset($data["estado"]) ? trim($data["estado"]) : "Pendiente";
    $tipo = isset($data["tipo"]) ? trim($data["tipo"]) : "Atraso";

    if ($id_usuario <= 0 || $id_libro <= 0 || $fecha_devolucion === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe completar los campos obligatorios."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $sql = "INSERT INTO multas
                (id_usuario, id_libro, fecha_devolucion, dias_retraso, dias_gracia, monto, estado, tipo)
                VALUES
                (:id_usuario, :id_libro, :fecha_devolucion, :dias_retraso, :dias_gracia, :monto, :estado, :tipo)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id_usuario" => $id_usuario,
            ":id_libro" => $id_libro,
            ":fecha_devolucion" => $fecha_devolucion,
            ":dias_retraso" => $dias_retraso,
            ":dias_gracia" => $dias_gracia,
            ":monto" => $monto,
            ":estado" => $estado,
            ":tipo" => $tipo
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Multa registrada correctamente."
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function actualizarMulta()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);

    $id = isset($data["id"]) ? intval($data["id"]) : 0;
    $id_usuario = isset($data["id_usuario"]) ? intval($data["id_usuario"]) : 0;
    $id_libro = isset($data["id_libro"]) ? intval($data["id_libro"]) : 0;
    $fecha_devolucion = isset($data["fecha_devolucion"]) ? trim($data["fecha_devolucion"]) : "";
    $dias_retraso = isset($data["dias_retraso"]) ? intval($data["dias_retraso"]) : 0;
    $dias_gracia = isset($data["dias_gracia"]) ? intval($data["dias_gracia"]) : 0;
    $monto = isset($data["monto"]) ? floatval($data["monto"]) : 0;
    $estado = isset($data["estado"]) ? trim($data["estado"]) : "Pendiente";
    $tipo = isset($data["tipo"]) ? trim($data["tipo"]) : "Atraso";

    if ($id <= 0 || $id_usuario <= 0 || $id_libro <= 0 || $fecha_devolucion === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe completar los campos obligatorios."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $sql = "UPDATE multas
                SET id_usuario = :id_usuario,
                    id_libro = :id_libro,
                    fecha_devolucion = :fecha_devolucion,
                    dias_retraso = :dias_retraso,
                    dias_gracia = :dias_gracia,
                    monto = :monto,
                    estado = :estado,
                    tipo = :tipo
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id" => $id,
            ":id_usuario" => $id_usuario,
            ":id_libro" => $id_libro,
            ":fecha_devolucion" => $fecha_devolucion,
            ":dias_retraso" => $dias_retraso,
            ":dias_gracia" => $dias_gracia,
            ":monto" => $monto,
            ":estado" => $estado,
            ":tipo" => $tipo
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Multa actualizada correctamente."
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}
