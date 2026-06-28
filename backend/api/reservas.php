<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

try {

    if ($method === "GET") {
        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
        $buscar = isset($_GET["buscar"]) ? trim($_GET["buscar"]) : "";

        if ($id > 0) {
            $sql = "SELECT r.id_reserva, r.usuario_id, r.libro_id, r.estado_reserva,
                           r.fecha_reserva, r.fecha_limite, r.posicion_lista_espera,
                           r.estado, r.observaciones,
                           u.nombre AS usuario, l.titulo AS libro
                    FROM reservas r
                    INNER JOIN usuarios u ON r.usuario_id = u.id
                    INNER JOIN libros l ON r.libro_id = l.id
                    WHERE r.id_reserva = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([":id" => $id]);
            $reserva = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($reserva) {
                echo json_encode(["success" => true, "data" => $reserva], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "La reserva no existe"], JSON_UNESCAPED_UNICODE);
            }
            exit;
        }

        // Búsqueda general
        if ($buscar !== "") {
            $sql = "SELECT r.id_reserva, u.nombre AS usuario, l.titulo AS libro, r.estado_reserva,
                           r.fecha_reserva, r.fecha_limite, r.estado
                    FROM reservas r
                    INNER JOIN usuarios u ON r.usuario_id = u.id
                    INNER JOIN libros l ON r.libro_id = l.id
                    WHERE u.nombre LIKE :buscar OR l.titulo LIKE :buscar
                    ORDER BY r.fecha_reserva DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([":buscar" => "%" . $buscar . "%"]);
        } else {
            $sql = "SELECT r.id_reserva, u.nombre AS usuario, l.titulo AS libro, r.estado_reserva,
                           r.fecha_reserva, r.fecha_limite, r.estado
                    FROM reservas r
                    INNER JOIN usuarios u ON r.usuario_id = u.id
                    INNER JOIN libros l ON r.libro_id = l.id
                    ORDER BY r.fecha_reserva DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute();
        }

        $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "cantidad" => count($reservas), "data" => $reservas], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === "POST") {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input) $input = $_POST;

        $usuario_id = intval($input["usuario_id"] ?? 0);
        $libro_id = intval($input["libro_id"] ?? 0);
        $estado_reserva = trim($input["estado_reserva"] ?? "Disponible");
        $fecha_reserva = trim($input["fecha_reserva"] ?? "");
        $fecha_limite = trim($input["fecha_limite"] ?? "");
        $posicion = intval($input["posicion_lista_espera"] ?? 1);
        $estado = trim($input["estado"] ?? "Activo");
        $observaciones = trim($input["observaciones"] ?? "");

        if ($usuario_id <= 0 || $libro_id <= 0 || $fecha_reserva === "" || $fecha_limite === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Debe completar los campos obligatorios"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "INSERT INTO reservas (usuario_id, libro_id, estado_reserva, fecha_reserva, fecha_limite, posicion_lista_espera, estado, observaciones)
                VALUES (:usuario_id, :libro_id, :estado_reserva, :fecha_reserva, :fecha_limite, :posicion, :estado, :observaciones)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":usuario_id" => $usuario_id,
            ":libro_id" => $libro_id,
            ":estado_reserva" => $estado_reserva,
            ":fecha_reserva" => $fecha_reserva,
            ":fecha_limite" => $fecha_limite,
            ":posicion" => $posicion,
            ":estado" => $estado,
            ":observaciones" => $observaciones
        ]);

        echo json_encode(["success" => true, "message" => "Reserva registrada correctamente", "id" => $pdo->lastInsertId()], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === "PUT") {
        $input = json_decode(file_get_contents("php://input"), true);

        $id = intval($input["id_reserva"] ?? 0);
        $estado_reserva = trim($input["estado_reserva"] ?? "");
        $fecha_limite = trim($input["fecha_limite"] ?? "");
        $estado = trim($input["estado"] ?? "");
        $observaciones = trim($input["observaciones"] ?? "");

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "El id de la reserva es obligatorio"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sqlExiste = "SELECT id_reserva FROM reservas WHERE id_reserva = :id";
        $stmtExiste = $pdo->prepare($sqlExiste);
        $stmtExiste->execute([":id" => $id]);

        if (!$stmtExiste->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "La reserva no existe"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "UPDATE reservas
                SET estado_reserva = :estado_reserva,
                    fecha_limite = :fecha_limite,
                    estado = :estado,
                    observaciones = :observaciones
                WHERE id_reserva = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":estado_reserva" => $estado_reserva,
            ":fecha_limite" => $fecha_limite,
            ":estado" => $estado,
            ":observaciones" => $observaciones,
            ":id" => $id
        ]);

        echo json_encode(["success" => true, "message" => "Reserva actualizada correctamente"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === "DELETE") {
        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "El id de la reserva es obligatorio"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sqlExiste = "SELECT id_reserva FROM reservas WHERE id_reserva = :id";
        $stmtExiste = $pdo->prepare($sqlExiste);
        $stmtExiste->execute([":id" => $id]);

        if (!$stmtExiste->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "La reserva no existe"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "DELETE FROM reservas WHERE id_reserva = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([":id" => $id]);

        echo json_encode(["success" => true, "message" => "Reserva eliminada correctamente"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error en el proceso", "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
