<?php

require_once "../config/headers.php";
require_once "../config/database.php";

function responderReporte($success, $message = "", $data = null, $status = 200)
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

function leerEntradaReporte()
{
    $data = json_decode(file_get_contents("php://input"), true);
    return is_array($data) ? $data : $_POST;
}

function validarReporte($data)
{
    $idUsuario = isset($data["id_usuario"]) && $data["id_usuario"] !== ""
        ? (int) $data["id_usuario"]
        : null;
    $tipo = trim($data["tipo_reporte"] ?? "");
    $fechaInicio = trim($data["fecha_inicio"] ?? "");
    $fechaFin = trim($data["fecha_fin"] ?? "");
    $estado = trim($data["estado"] ?? "Generado");

    if (!in_array($tipo, ["Prestamos", "Devoluciones", "Multas"], true)) {
        responderReporte(false, "El tipo de reporte no es válido.", null, 400);
    }

    if ($fechaInicio === "" || $fechaFin === "") {
        responderReporte(false, "El rango de fechas es obligatorio.", null, 400);
    }

    if ($fechaInicio > $fechaFin) {
        responderReporte(false, "La fecha inicial no puede ser posterior a la fecha final.", null, 400);
    }

    if (!in_array($estado, ["Generado", "Archivado"], true)) {
        responderReporte(false, "El estado del reporte no es válido.", null, 400);
    }

    return [$idUsuario, $tipo, $fechaInicio, $fechaFin, $estado];
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $id = isset($_GET["id"]) ? (int) $_GET["id"] : 0;
        $tipo = trim($_GET["tipo"] ?? "");
        $sql = "SELECT r.id, r.id_usuario, COALESCE(u.nombre, 'Sin asignar') AS usuario,
                       r.tipo_reporte, r.fecha_generacion, r.fecha_inicio,
                       r.fecha_fin, r.estado
                FROM reportes r
                LEFT JOIN usuarios u ON u.id = r.id_usuario";
        $params = [];
        $conditions = [];

        if ($id > 0) {
            $conditions[] = "r.id = :id";
            $params[":id"] = $id;
        }

        if ($tipo !== "") {
            $conditions[] = "r.tipo_reporte = :tipo";
            $params[":tipo"] = $tipo;
        }

        if ($conditions) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY r.fecha_generacion DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($id > 0) {
            $reporte = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$reporte) {
                responderReporte(false, "El reporte no existe.", null, 404);
            }
            responderReporte(true, "", $reporte);
        }

        responderReporte(true, "", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($method === "POST") {
        $data = leerEntradaReporte();
        [$idUsuario, $tipo, $fechaInicio, $fechaFin, $estado] = validarReporte($data);

        if ($idUsuario !== null) {
            $usuario = $pdo->prepare("SELECT id FROM usuarios WHERE id = :id");
            $usuario->execute([":id" => $idUsuario]);
            if (!$usuario->fetch()) {
                responderReporte(false, "El usuario indicado no existe.", null, 404);
            }
        }

        $stmt = $pdo->prepare(
            "INSERT INTO reportes (id_usuario, tipo_reporte, fecha_inicio, fecha_fin, estado)
             VALUES (:id_usuario, :tipo_reporte, :fecha_inicio, :fecha_fin, :estado)"
        );
        $stmt->execute([
            ":id_usuario" => $idUsuario,
            ":tipo_reporte" => $tipo,
            ":fecha_inicio" => $fechaInicio,
            ":fecha_fin" => $fechaFin,
            ":estado" => $estado
        ]);

        responderReporte(true, "Reporte generado correctamente.", ["id" => $pdo->lastInsertId()], 201);
    }

    if ($method === "PUT") {
        $data = leerEntradaReporte();
        $id = (int) ($data["id"] ?? 0);

        if ($id <= 0) {
            responderReporte(false, "El id del reporte es obligatorio.", null, 400);
        }

        [$idUsuario, $tipo, $fechaInicio, $fechaFin, $estado] = validarReporte($data);

        if ($idUsuario !== null) {
            $usuario = $pdo->prepare("SELECT id FROM usuarios WHERE id = :id");
            $usuario->execute([":id" => $idUsuario]);
            if (!$usuario->fetch()) {
                responderReporte(false, "El usuario indicado no existe.", null, 404);
            }
        }

        $stmt = $pdo->prepare(
            "UPDATE reportes
             SET id_usuario = :id_usuario, tipo_reporte = :tipo_reporte,
                 fecha_inicio = :fecha_inicio, fecha_fin = :fecha_fin, estado = :estado
             WHERE id = :id"
        );
        $stmt->execute([
            ":id" => $id,
            ":id_usuario" => $idUsuario,
            ":tipo_reporte" => $tipo,
            ":fecha_inicio" => $fechaInicio,
            ":fecha_fin" => $fechaFin,
            ":estado" => $estado
        ]);

        if ($stmt->rowCount() === 0) {
            $existe = $pdo->prepare("SELECT id FROM reportes WHERE id = :id");
            $existe->execute([":id" => $id]);
            if (!$existe->fetch()) {
                responderReporte(false, "El reporte que desea editar no existe.", null, 404);
            }
        }

        responderReporte(true, "Reporte actualizado correctamente.");
    }

    if ($method === "DELETE") {
        $data = leerEntradaReporte();
        $id = isset($_GET["id"]) ? (int) $_GET["id"] : (int) ($data["id"] ?? 0);

        if ($id <= 0) {
            responderReporte(false, "El id del reporte es obligatorio.", null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM reportes WHERE id = :id");
        $stmt->execute([":id" => $id]);

        if ($stmt->rowCount() === 0) {
            responderReporte(false, "El reporte que desea eliminar no existe.", null, 404);
        }

        responderReporte(true, "Reporte eliminado correctamente.");
    }

    responderReporte(false, "Método no permitido.", null, 405);
} catch (PDOException $e) {
    responderReporte(false, "Ocurrió un error al procesar los reportes.", null, 500);
}
