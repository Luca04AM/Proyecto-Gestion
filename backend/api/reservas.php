<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "OPTIONS") {
    http_response_code(200);
    exit;
}

function responder($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function normalizarEstadoLibro($estado) {
    $estado = trim($estado ?? "");

    $permitidos = [
        "Disponible",
        "Prestado",
        "Reservado",
        "No disponible"
    ];

    if (in_array($estado, $permitidos)) {
        return $estado;
    }

    return "";
}

function normalizarEstadoReserva($estado) {
    $estado = trim($estado ?? "");

    $permitidos = [
        "Activo",
        "En espera",
        "Cancelado",
        "Finalizado",
        "Inactivo"
    ];

    if (in_array($estado, $permitidos)) {
        return $estado;
    }

    return "";
}

function obtenerLibro($pdo, $libro_id) {
    $sql = "SELECT id, titulo, estado
            FROM libros
            WHERE id = :libro_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":libro_id" => $libro_id
    ]);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function existeReservaVigenteUsuario($pdo, $usuario_id, $libro_id, $id_actual = 0) {
    $sql = "SELECT id
            FROM reservas
            WHERE usuario_id = :usuario_id
              AND libro_id = :libro_id
              AND estado IN ('Activo', 'En espera')";

    $params = [
        ":usuario_id" => $usuario_id,
        ":libro_id" => $libro_id
    ];

    if ($id_actual > 0) {
        $sql .= " AND id <> :id_actual";
        $params[":id_actual"] = $id_actual;
    }

    $sql .= " LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetch(PDO::FETCH_ASSOC) ? true : false;
}

function libroTieneReservaActiva($pdo, $libro_id, $id_actual = 0) {
    $sql = "SELECT id
            FROM reservas
            WHERE libro_id = :libro_id
              AND estado = 'Activo'";

    $params = [
        ":libro_id" => $libro_id
    ];

    if ($id_actual > 0) {
        $sql .= " AND id <> :id_actual";
        $params[":id_actual"] = $id_actual;
    }

    $sql .= " LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetch(PDO::FETCH_ASSOC) ? true : false;
}

function calcularSiguientePosicion($pdo, $libro_id, $id_actual = 0) {
    $sql = "SELECT COUNT(*) + 1 AS siguiente
            FROM reservas
            WHERE libro_id = :libro_id
              AND estado_reserva IN ('Prestado', 'Reservado')
              AND estado = 'En espera'";

    $params = [
        ":libro_id" => $libro_id
    ];

    if ($id_actual > 0) {
        $sql .= " AND id <> :id_actual";
        $params[":id_actual"] = $id_actual;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $fila = $stmt->fetch(PDO::FETCH_ASSOC);

    return intval($fila["siguiente"]);
}

function reordenarCola($pdo, $libro_id) {

    $sqlLimpiar = "UPDATE reservas
                   SET posicion_lista_espera = 0
                   WHERE libro_id = :libro_id
                     AND estado IN ('Cancelado', 'Finalizado', 'Inactivo')";

    $stmtLimpiar = $pdo->prepare($sqlLimpiar);
    $stmtLimpiar->execute([
        ":libro_id" => $libro_id
    ]);

    $sql = "SELECT id
            FROM reservas
            WHERE libro_id = :libro_id
              AND estado_reserva IN ('Prestado', 'Reservado')
              AND estado = 'En espera'
            ORDER BY posicion_lista_espera ASC, fecha_reserva ASC, id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":libro_id" => $libro_id
    ]);

    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $posicion = 1;

    foreach ($reservas as $reserva) {
        $sqlUpdate = "UPDATE reservas
                      SET posicion_lista_espera = :posicion
                      WHERE id = :id";

        $stmtUpdate = $pdo->prepare($sqlUpdate);
        $stmtUpdate->execute([
            ":posicion" => $posicion,
            ":id" => $reserva["id"]
        ]);

        $posicion++;
    }
}

function actualizarEstadoLibro($pdo, $libro_id) {
    $libro = obtenerLibro($pdo, $libro_id);

    if (!$libro) {
        return;
    }

    $estadoActual = $libro["estado"];

    if ($estadoActual === "Prestado" || $estadoActual === "No disponible") {
        return;
    }

    $sql = "SELECT COUNT(*) AS total
            FROM reservas
            WHERE libro_id = :libro_id
              AND estado IN ('Activo', 'En espera')";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":libro_id" => $libro_id
    ]);

    $fila = $stmt->fetch(PDO::FETCH_ASSOC);
    $total = intval($fila["total"]);

    $nuevoEstado = $total > 0 ? "Reservado" : "Disponible";

    $sqlUpdate = "UPDATE libros
                  SET estado = :estado
                  WHERE id = :libro_id
                    AND estado IN ('Disponible', 'Reservado')";

    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->execute([
        ":estado" => $nuevoEstado,
        ":libro_id" => $libro_id
    ]);
}

function aplicarEstadoLibroSeleccionado($pdo, $libro_id, $estado_reserva, $estado_final) {
    if ($estado_reserva === "Disponible" && $estado_final === "Activo") {
        $sql = "UPDATE libros
                SET estado = 'Reservado'
                WHERE id = :libro_id
                  AND estado = 'Disponible'";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":libro_id" => $libro_id
        ]);

        return;
    }

    if ($estado_reserva === "Prestado" || $estado_reserva === "Reservado") {
        $sql = "UPDATE libros
                SET estado = :estado
                WHERE id = :libro_id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":estado" => $estado_reserva,
            ":libro_id" => $libro_id
        ]);
    }
}

try {

    if ($method === "GET") {

        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
        $buscar = isset($_GET["buscar"]) ? trim($_GET["buscar"]) : "";

        if (isset($_GET["next_position"])) {
            $libro_id = isset($_GET["libro_id"]) ? intval($_GET["libro_id"]) : 0;

            if ($libro_id <= 0) {
                responder([
                    "success" => false,
                    "message" => "El id del libro es obligatorio"
                ], 400);
            }

            $posicion = calcularSiguientePosicion($pdo, $libro_id);

            responder([
                "success" => true,
                "posicion" => $posicion
            ]);
        }

        if (isset($_GET["stats"])) {

            $total = $pdo->query("SELECT COUNT(*) AS total FROM reservas")
                         ->fetch(PDO::FETCH_ASSOC);

            $activas = $pdo->query("SELECT COUNT(*) AS total FROM reservas WHERE estado = 'Activo'")
                           ->fetch(PDO::FETCH_ASSOC);

            $espera = $pdo->query("SELECT COUNT(*) AS total FROM reservas WHERE estado = 'En espera'")
                          ->fetch(PDO::FETCH_ASSOC);

            $libros = $pdo->query("SELECT COUNT(*) AS total FROM libros WHERE estado = 'Disponible'")
                          ->fetch(PDO::FETCH_ASSOC);

            responder([
                "success" => true,
                "data" => [
                    "total" => $total["total"],
                    "activas" => $activas["total"],
                    "espera" => $espera["total"],
                    "libros" => $libros["total"]
                ]
            ]);
        }

        $sql = "SELECT
                    r.id,
                    r.usuario_id,
                    r.libro_id,
                    r.estado_reserva,
                    r.fecha_reserva,
                    r.fecha_limite,
                    r.posicion_lista_espera,
                    r.estado,
                    r.observaciones,
                    u.nombre AS usuario,
                    l.titulo AS libro,
                    l.estado AS estado_libro
                FROM reservas r
                INNER JOIN usuarios u ON r.usuario_id = u.id
                INNER JOIN libros l ON r.libro_id = l.id";

        $params = [];

        if ($id > 0) {
            $sql .= " WHERE r.id = :id";
            $params[":id"] = $id;
        } elseif ($buscar !== "") {
            $sql .= " WHERE u.nombre LIKE :buscar
                      OR l.titulo LIKE :buscar
                      OR r.estado LIKE :buscar
                      OR r.estado_reserva LIKE :buscar
                      OR r.observaciones LIKE :buscar";

            $params[":buscar"] = "%" . $buscar . "%";
        }

        $sql .= " ORDER BY r.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($id > 0) {
            $reserva = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reserva) {
                responder([
                    "success" => false,
                    "message" => "La reserva no existe"
                ], 404);
            }

            responder([
                "success" => true,
                "data" => $reserva
            ]);
        }

        $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        responder([
            "success" => true,
            "cantidad" => count($reservas),
            "data" => $reservas
        ]);
    }

    if ($method === "POST") {

        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input) {
            $input = $_POST;
        }

        $usuario_id = intval($input["usuario_id"] ?? 0);
        $libro_id = intval($input["libro_id"] ?? 0);
        $estado_reserva = normalizarEstadoLibro($input["estado_reserva"] ?? "");
        $fecha_reserva = trim($input["fecha_reserva"] ?? "");
        $fecha_limite = trim($input["fecha_limite"] ?? "");
        $observaciones = trim($input["observaciones"] ?? "");

        if ($usuario_id <= 0 || $libro_id <= 0) {
            responder([
                "success" => false,
                "message" => "Debe seleccionar usuario y libro"
            ], 400);
        }

        if ($estado_reserva === "") {
            responder([
                "success" => false,
                "message" => "Debe seleccionar el estado del libro"
            ], 400);
        }

        if ($fecha_reserva === "" || $fecha_limite === "") {
            responder([
                "success" => false,
                "message" => "Debe completar fecha de reserva y fecha límite"
            ], 400);
        }

        $libro = obtenerLibro($pdo, $libro_id);

        if (!$libro) {
            responder([
                "success" => false,
                "message" => "El libro seleccionado no existe"
            ], 404);
        }

        if ($estado_reserva === "No disponible") {
            responder([
                "success" => false,
                "message" => "El libro está no disponible, por lo tanto no se puede registrar reserva"
            ], 400);
        }

        if (existeReservaVigenteUsuario($pdo, $usuario_id, $libro_id)) {
            responder([
                "success" => false,
                "message" => "Este usuario ya posee una reserva activa o en espera para este libro"
            ], 400);
        }

        if ($estado_reserva === "Disponible" && libroTieneReservaActiva($pdo, $libro_id)) {
            $estado_reserva = "Reservado";
        }

        if ($estado_reserva === "Disponible") {
            $estado = "Activo";
            $posicion = 0;

            if ($observaciones === "") {
                $observaciones = "El libro está disponible, no requiere reservar.";
            }
        } elseif ($estado_reserva === "Prestado" || $estado_reserva === "Reservado") {
            $estado = "En espera";
            $posicion = calcularSiguientePosicion($pdo, $libro_id);

            $observaciones = "El libro está " . $estado_reserva .
                ". La reserva queda en lista de espera en la posición " . $posicion . ".";
        } else {
            responder([
                "success" => false,
                "message" => "Estado del libro no válido"
            ], 400);
        }

        $pdo->beginTransaction();

        $sql = "INSERT INTO reservas
                    (usuario_id, libro_id, estado_reserva, fecha_reserva, fecha_limite, posicion_lista_espera, estado, observaciones)
                VALUES
                    (:usuario_id, :libro_id, :estado_reserva, :fecha_reserva, :fecha_limite, :posicion, :estado, :observaciones)";

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

        $idNuevo = $pdo->lastInsertId();

        aplicarEstadoLibroSeleccionado($pdo, $libro_id, $estado_reserva, $estado);
        reordenarCola($pdo, $libro_id);

        $pdo->commit();

        responder([
            "success" => true,
            "message" => "Reserva registrada correctamente",
            "id" => $idNuevo,
            "posicion" => $posicion,
            "estado" => $estado,
            "estado_reserva" => $estado_reserva
        ]);
    }

    if ($method === "PUT") {

        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input) {
            responder([
                "success" => false,
                "message" => "No se recibieron datos para actualizar"
            ], 400);
        }

        $id = intval($input["id"] ?? $input["id_reserva"] ?? 0);

        if ($id <= 0) {
            responder([
                "success" => false,
                "message" => "El id de la reserva es obligatorio"
            ], 400);
        }

        $accion = trim($input["accion"] ?? "");

        if ($accion === "asignar_libro") {

            $pdo->beginTransaction();

            $sqlReserva = "SELECT *
                           FROM reservas
                           WHERE id = :id
                           FOR UPDATE";

            $stmtReserva = $pdo->prepare($sqlReserva);
            $stmtReserva->execute([
                ":id" => $id
            ]);

            $reserva = $stmtReserva->fetch(PDO::FETCH_ASSOC);

            if (!$reserva) {
                $pdo->rollBack();

                responder([
                    "success" => false,
                    "message" => "La reserva no existe"
                ], 404);
            }

            $estadoActualReserva = trim($reserva["estado"] ?? "");

            if ($estadoActualReserva !== "Activo" && $estadoActualReserva !== "En espera") {
                $pdo->rollBack();

                responder([
                    "success" => false,
                    "message" => "No se puede asignar este libro porque la reserva ya está " . $estadoActualReserva
                ], 400);
            }

            $libro_id = intval($reserva["libro_id"]);

            $sqlUpdateReserva = "UPDATE reservas
                                 SET estado = 'Finalizado',
                                     posicion_lista_espera = 0,
                                     observaciones = 'Libro asignado al usuario. Reserva finalizada.'
                                 WHERE id = :id";

            $stmtUpdateReserva = $pdo->prepare($sqlUpdateReserva);
            $stmtUpdateReserva->execute([
                ":id" => $id
            ]);

            $sqlUpdateLibro = "UPDATE libros
                               SET estado = 'Prestado'
                               WHERE id = :libro_id";

            $stmtUpdateLibro = $pdo->prepare($sqlUpdateLibro);
            $stmtUpdateLibro->execute([
                ":libro_id" => $libro_id
            ]);

            reordenarCola($pdo, $libro_id);

            $pdo->commit();

            responder([
                "success" => true,
                "message" => "Libro asignado correctamente. Reserva finalizada y cola actualizada."
            ]);
        }

        $sqlExiste = "SELECT *
                      FROM reservas
                      WHERE id = :id";

        $stmtExiste = $pdo->prepare($sqlExiste);
        $stmtExiste->execute([
            ":id" => $id
        ]);

        $reservaActual = $stmtExiste->fetch(PDO::FETCH_ASSOC);

        if (!$reservaActual) {
            responder([
                "success" => false,
                "message" => "La reserva no existe"
            ], 404);
        }

        $libroAnterior = intval($reservaActual["libro_id"]);

        $usuario_id = intval($input["usuario_id"] ?? $reservaActual["usuario_id"]);
        $libro_id = intval($input["libro_id"] ?? $reservaActual["libro_id"]);
        $estado_reserva = normalizarEstadoLibro($input["estado_reserva"] ?? $reservaActual["estado_reserva"]);
        $fecha_reserva = trim($input["fecha_reserva"] ?? $reservaActual["fecha_reserva"]);
        $fecha_limite = trim($input["fecha_limite"] ?? $reservaActual["fecha_limite"]);
        $estado = normalizarEstadoReserva($input["estado"] ?? $reservaActual["estado"]);
        $observaciones = trim($input["observaciones"] ?? $reservaActual["observaciones"]);

        if ($usuario_id <= 0 || $libro_id <= 0) {
            responder([
                "success" => false,
                "message" => "Debe seleccionar usuario y libro"
            ], 400);
        }

        if ($estado_reserva === "") {
            responder([
                "success" => false,
                "message" => "Debe seleccionar el estado del libro"
            ], 400);
        }

        if ($fecha_reserva === "" || $fecha_limite === "") {
            responder([
                "success" => false,
                "message" => "Debe completar fecha de reserva y fecha límite"
            ], 400);
        }

        if (!obtenerLibro($pdo, $libro_id)) {
            responder([
                "success" => false,
                "message" => "El libro seleccionado no existe"
            ], 404);
        }

        if ($estado_reserva === "No disponible") {
            responder([
                "success" => false,
                "message" => "No se puede actualizar una reserva con libro no disponible"
            ], 400);
        }

        if (existeReservaVigenteUsuario($pdo, $usuario_id, $libro_id, $id)) {
            responder([
                "success" => false,
                "message" => "Este usuario ya posee otra reserva activa o en espera para este libro"
            ], 400);
        }

        if ($estado === "Cancelado" || $estado === "Finalizado" || $estado === "Inactivo") {
            $posicion = 0;
        } elseif ($estado_reserva === "Disponible") {
            $estado = "Activo";
            $posicion = 0;

            if ($observaciones === "") {
                $observaciones = "El libro está disponible, no requiere reservar.";
            }
        } elseif ($estado_reserva === "Prestado" || $estado_reserva === "Reservado") {
            $estado = "En espera";

            $mismaReservaEnEspera =
                intval($reservaActual["libro_id"]) === $libro_id &&
                $reservaActual["estado"] === "En espera" &&
                intval($reservaActual["posicion_lista_espera"]) > 0;

            if ($mismaReservaEnEspera) {
                $posicion = intval($reservaActual["posicion_lista_espera"]);
            } else {
                $posicion = calcularSiguientePosicion($pdo, $libro_id, $id);
            }

            $observaciones = "El libro está " . $estado_reserva .
                ". La reserva queda en lista de espera en la posición " . $posicion . ".";
        } else {
            responder([
                "success" => false,
                "message" => "Estado del libro no válido"
            ], 400);
        }

        $pdo->beginTransaction();

        $sql = "UPDATE reservas
                SET usuario_id = :usuario_id,
                    libro_id = :libro_id,
                    estado_reserva = :estado_reserva,
                    fecha_reserva = :fecha_reserva,
                    fecha_limite = :fecha_limite,
                    posicion_lista_espera = :posicion,
                    estado = :estado,
                    observaciones = :observaciones
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":usuario_id" => $usuario_id,
            ":libro_id" => $libro_id,
            ":estado_reserva" => $estado_reserva,
            ":fecha_reserva" => $fecha_reserva,
            ":fecha_limite" => $fecha_limite,
            ":posicion" => $posicion,
            ":estado" => $estado,
            ":observaciones" => $observaciones,
            ":id" => $id
        ]);

        reordenarCola($pdo, $libroAnterior);

        if ($libroAnterior !== $libro_id) {
            reordenarCola($pdo, $libro_id);
        }

        actualizarEstadoLibro($pdo, $libroAnterior);
        actualizarEstadoLibro($pdo, $libro_id);

        aplicarEstadoLibroSeleccionado($pdo, $libro_id, $estado_reserva, $estado);

        $pdo->commit();

        responder([
            "success" => true,
            "message" => "Reserva actualizada correctamente",
            "id" => $id,
            "posicion" => $posicion,
            "estado" => $estado,
            "estado_reserva" => $estado_reserva
        ]);
    }

    if ($method === "DELETE") {

        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;

        if ($id <= 0) {
            responder([
                "success" => false,
                "message" => "El id de la reserva es obligatorio"
            ], 400);
        }

        $sqlExiste = "SELECT id, libro_id, estado
                      FROM reservas
                      WHERE id = :id";

        $stmtExiste = $pdo->prepare($sqlExiste);
        $stmtExiste->execute([
            ":id" => $id
        ]);

        $reserva = $stmtExiste->fetch(PDO::FETCH_ASSOC);

        if (!$reserva) {
            responder([
                "success" => false,
                "message" => "La reserva no existe"
            ], 404);
        }

        $estadoActualReserva = trim($reserva["estado"] ?? "");

        if ($estadoActualReserva !== "Activo" && $estadoActualReserva !== "En espera") {
            responder([
                "success" => false,
                "message" => "No se puede cancelar esta reserva porque ya está " . $estadoActualReserva
            ], 400);
        }

        $libro_id = intval($reserva["libro_id"]);

        $pdo->beginTransaction();

        $sql = "UPDATE reservas
                SET estado = 'Cancelado',
                    posicion_lista_espera = 0
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id" => $id
        ]);

        reordenarCola($pdo, $libro_id);
        actualizarEstadoLibro($pdo, $libro_id);

        $pdo->commit();

        responder([
            "success" => true,
            "message" => "Reserva cancelada correctamente y cola actualizada"
        ]);
    }

    responder([
        "success" => false,
        "message" => "Método no permitido"
    ], 405);

} catch (PDOException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder([
        "success" => false,
        "message" => "Error en el proceso",
        "error" => $e->getMessage()
    ], 500);
}