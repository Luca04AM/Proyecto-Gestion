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

function libroTienePrestamoActivo($pdo, $libro_id) {
    $sql = "SELECT id
            FROM prestamos
            WHERE id_libro = :libro_id
              AND estado = 'Prestado'
            LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":libro_id" => $libro_id
    ]);

    return $stmt->fetch(PDO::FETCH_ASSOC) ? true : false;
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

function contarReservasVigentesLibro($pdo, $libro_id, $id_actual = 0) {
    $sql = "SELECT COUNT(*) AS total
            FROM reservas
            WHERE libro_id = :libro_id
              AND estado IN ('Activo', 'En espera')";

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

    return intval($fila["total"] ?? 0);
}

function calcularLogicaReserva($pdo, $libro_id, $id_actual = 0) {
    $libro = obtenerLibro($pdo, $libro_id);

    if (!$libro) {
        return [
            "success" => false,
            "message" => "El libro seleccionado no existe"
        ];
    }

    $estadoLibroActual = trim($libro["estado"] ?? "");
    $estadoNormalizado = mb_strtolower($estadoLibroActual, "UTF-8");

    $tienePrestamoActivo = libroTienePrestamoActivo($pdo, $libro_id);
    $cantidadReservasVigentes = contarReservasVigentesLibro($pdo, $libro_id, $id_actual);
    $siguientePosicion = $cantidadReservasVigentes + 1;

    if ($estadoNormalizado === "no disponible") {
        return [
            "success" => false,
            "message" => "El libro no está disponible para reservar",
            "estado_actual_libro" => $estadoLibroActual
        ];
    }

    if ($estadoNormalizado === "disponible" && !$tienePrestamoActivo && $cantidadReservasVigentes === 0) {
        return [
            "success" => false,
            "message" => "El libro está disponible, no requiere reservación",
            "estado_actual_libro" => $estadoLibroActual
        ];
    }

    if ($tienePrestamoActivo || $estadoNormalizado === "prestado") {

        if ($cantidadReservasVigentes === 0) {
            return [
                "success" => true,
                "estado_reserva" => "Prestado",
                "estado" => "Activo",
                "posicion" => 1,
                "observaciones" => "El libro está Prestado. La reserva queda activa como primera persona en la lista.",
                "estado_actual_libro" => $estadoLibroActual
            ];
        }

        return [
            "success" => true,
            "estado_reserva" => "Reservado",
            "estado" => "En espera",
            "posicion" => $siguientePosicion,
            "observaciones" => "El libro está Prestado y ya tiene reservas. La reserva queda en lista de espera en la posición " . $siguientePosicion . ".",
            "estado_actual_libro" => $estadoLibroActual
        ];
    }

    if ($estadoNormalizado === "reservado" || $cantidadReservasVigentes > 0) {
        return [
            "success" => true,
            "estado_reserva" => "Reservado",
            "estado" => "En espera",
            "posicion" => $siguientePosicion,
            "observaciones" => "El libro está Reservado. La reserva queda en lista de espera en la posición " . $siguientePosicion . ".",
            "estado_actual_libro" => $estadoLibroActual
        ];
    }

    return [
        "success" => false,
        "message" => "No se puede registrar la reserva con el estado actual del libro",
        "estado_actual_libro" => $estadoLibroActual
    ];
}

function reordenarCola($pdo, $libro_id) {
    /*
        Limpia reservas que ya no pertenecen a la fila.
    */
    $sqlLimpiar = "UPDATE reservas
                   SET posicion_lista_espera = 0
                   WHERE libro_id = :libro_id
                     AND estado IN ('Cancelado', 'Finalizado', 'Inactivo')";

    $stmtLimpiar = $pdo->prepare($sqlLimpiar);
    $stmtLimpiar->execute([
        ":libro_id" => $libro_id
    ]);

    /*
        Busca únicamente reservas vivas del libro.
        La primera será Activa/Prestado.
        Las demás serán En espera/Reservado.
    */
    $sql = "SELECT id
            FROM reservas
            WHERE libro_id = :libro_id
              AND estado IN ('Activo', 'En espera')
            ORDER BY 
                CASE 
                    WHEN posicion_lista_espera > 0 THEN posicion_lista_espera
                    ELSE 999999
                END ASC,
                fecha_reserva ASC,
                id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":libro_id" => $libro_id
    ]);

    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $posicion = 1;

    foreach ($reservas as $reserva) {

        if ($posicion === 1) {
            $estadoReserva = "Activo";
            $estadoLibroReserva = "Prestado";
            $observaciones = "El libro está Prestado. La reserva queda activa como primera persona en la lista.";
        } else {
            $estadoReserva = "En espera";
            $estadoLibroReserva = "Reservado";
            $observaciones = "El libro está Reservado. La reserva queda en lista de espera en la posición " . $posicion . ".";
        }

        $sqlUpdate = "UPDATE reservas
                      SET posicion_lista_espera = :posicion,
                          estado = :estado,
                          estado_reserva = :estado_reserva,
                          observaciones = :observaciones
                      WHERE id = :id";

        $stmtUpdate = $pdo->prepare($sqlUpdate);
        $stmtUpdate->execute([
            ":posicion" => $posicion,
            ":estado" => $estadoReserva,
            ":estado_reserva" => $estadoLibroReserva,
            ":observaciones" => $observaciones,
            ":id" => $reserva["id"]
        ]);

        $posicion++;
    }
}

function actualizarEstadoLibroSegunSistema($pdo, $libro_id) {
    $libro = obtenerLibro($pdo, $libro_id);

    if (!$libro) {
        return;
    }

    if ($libro["estado"] === "No disponible") {
        return;
    }

    $tienePrestamoActivo = libroTienePrestamoActivo($pdo, $libro_id);
    $cantidadReservas = contarReservasVigentesLibro($pdo, $libro_id);

    if ($tienePrestamoActivo) {
        $nuevoEstado = "Prestado";
    } elseif ($cantidadReservas > 0) {
        $nuevoEstado = "Reservado";
    } else {
        $nuevoEstado = "Disponible";
    }

    $sql = "UPDATE libros
            SET estado = :estado
            WHERE id = :libro_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":estado" => $nuevoEstado,
        ":libro_id" => $libro_id
    ]);
}

try {

    if ($method === "GET") {

        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
        $buscar = isset($_GET["buscar"]) ? trim($_GET["buscar"]) : "";

        if (isset($_GET["preview"])) {
            $libro_id = isset($_GET["libro_id"]) ? intval($_GET["libro_id"]) : 0;
            $id_actual = isset($_GET["id_actual"]) ? intval($_GET["id_actual"]) : 0;

            if ($libro_id <= 0) {
                responder([
                    "success" => false,
                    "message" => "El id del libro es obligatorio"
                ], 400);
            }

            $logica = calcularLogicaReserva($pdo, $libro_id, $id_actual);

            responder($logica, $logica["success"] ? 200 : 400);
        }

        if (isset($_GET["next_position"])) {
            $libro_id = isset($_GET["libro_id"]) ? intval($_GET["libro_id"]) : 0;

            if ($libro_id <= 0) {
                responder([
                    "success" => false,
                    "message" => "El id del libro es obligatorio"
                ], 400);
            }

            $posicion = contarReservasVigentesLibro($pdo, $libro_id) + 1;

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
        $fecha_reserva = trim($input["fecha_reserva"] ?? date("Y-m-d"));
        $fecha_limite = trim($input["fecha_limite"] ?? date("Y-m-d", strtotime("+3 days")));
        $observacionesUsuario = trim($input["observaciones"] ?? "");

        if ($usuario_id <= 0 || $libro_id <= 0) {
            responder([
                "success" => false,
                "message" => "Debe seleccionar usuario y libro"
            ], 400);
        }

        if (existeReservaVigenteUsuario($pdo, $usuario_id, $libro_id)) {
            responder([
                "success" => false,
                "message" => "Este usuario ya posee una reserva activa o en espera para este libro"
            ], 400);
        }

        $pdo->beginTransaction();

        $logica = calcularLogicaReserva($pdo, $libro_id);

        if (!$logica["success"]) {
            $pdo->rollBack();

            responder([
                "success" => false,
                "message" => $logica["message"]
            ], 400);
        }

        $estado_reserva = $logica["estado_reserva"];
        $estado = $logica["estado"];
        $posicion = intval($logica["posicion"]);
        $observaciones = $observacionesUsuario !== "" ? $observacionesUsuario : $logica["observaciones"];

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

        reordenarCola($pdo, $libro_id);
        actualizarEstadoLibroSegunSistema($pdo, $libro_id);

        $pdo->commit();

        responder([
            "success" => true,
            "message" => "Reserva registrada correctamente",
            "id" => $idNuevo,
            "estado_reserva" => $estado_reserva,
            "estado" => $estado,
            "posicion" => $posicion
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

            $usuario_id = intval($reserva["usuario_id"]);
            $libro_id = intval($reserva["libro_id"]);
            $fecha_limite = trim($reserva["fecha_limite"] ?? "");

            if ($fecha_limite === "") {
                $fecha_limite = date("Y-m-d");
            }

            if (libroTienePrestamoActivo($pdo, $libro_id)) {
                $pdo->rollBack();

                responder([
                    "success" => false,
                    "message" => "Este libro ya tiene un préstamo activo. Primero debe registrar la devolución del préstamo actual."
                ], 400);
            }

            $sqlInsertPrestamo = "INSERT INTO prestamos
                                      (id_usuario, id_libro, fecha_prestamo, fecha_devolucion, estado)
                                  VALUES
                                      (:id_usuario, :id_libro, NOW(), :fecha_devolucion, 'Prestado')";

            $stmtInsertPrestamo = $pdo->prepare($sqlInsertPrestamo);
            $stmtInsertPrestamo->execute([
                ":id_usuario" => $usuario_id,
                ":id_libro" => $libro_id,
                ":fecha_devolucion" => $fecha_limite
            ]);

            $idPrestamo = $pdo->lastInsertId();

            $sqlUpdateReserva = "UPDATE reservas
                                 SET estado = 'Finalizado',
                                     estado_reserva = 'Prestado',
                                     posicion_lista_espera = 0,
                                     observaciones = 'Libro asignado al usuario. Reserva finalizada y préstamo generado.'
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
            actualizarEstadoLibroSegunSistema($pdo, $libro_id);

            $pdo->commit();

            responder([
                "success" => true,
                "message" => "Libro asignado correctamente. Reserva finalizada, préstamo generado y cola actualizada.",
                "id_prestamo" => $idPrestamo
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
        $fecha_reserva = trim($input["fecha_reserva"] ?? $reservaActual["fecha_reserva"]);
        $fecha_limite = trim($input["fecha_limite"] ?? $reservaActual["fecha_limite"]);
        $observaciones = trim($input["observaciones"] ?? $reservaActual["observaciones"]);
        $estadoFormulario = normalizarEstadoReserva($input["estado"] ?? $reservaActual["estado"]);

        if ($usuario_id <= 0 || $libro_id <= 0) {
            responder([
                "success" => false,
                "message" => "Debe seleccionar usuario y libro"
            ], 400);
        }

        if (existeReservaVigenteUsuario($pdo, $usuario_id, $libro_id, $id)) {
            responder([
                "success" => false,
                "message" => "Este usuario ya posee otra reserva activa o en espera para este libro"
            ], 400);
        }

        $pdo->beginTransaction();

        if ($estadoFormulario === "Cancelado" || $estadoFormulario === "Finalizado" || $estadoFormulario === "Inactivo") {

            $estado = $estadoFormulario;
            $estado_reserva = $reservaActual["estado_reserva"];
            $posicion = 0;

        } else {

            $mismaReservaVigente =
                intval($reservaActual["libro_id"]) === $libro_id &&
                in_array($reservaActual["estado"], ["Activo", "En espera"]);

            if ($mismaReservaVigente) {
                $estado = $reservaActual["estado"];
                $estado_reserva = $reservaActual["estado_reserva"];
                $posicion = intval($reservaActual["posicion_lista_espera"]);
            } else {
                $logica = calcularLogicaReserva($pdo, $libro_id, $id);

                if (!$logica["success"]) {
                    $pdo->rollBack();

                    responder([
                        "success" => false,
                        "message" => $logica["message"]
                    ], 400);
                }

                $estado = $logica["estado"];
                $estado_reserva = $logica["estado_reserva"];
                $posicion = intval($logica["posicion"]);

                if ($observaciones === "") {
                    $observaciones = $logica["observaciones"];
                }
            }
        }

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

        actualizarEstadoLibroSegunSistema($pdo, $libroAnterior);
        actualizarEstadoLibroSegunSistema($pdo, $libro_id);

        $pdo->commit();

        responder([
            "success" => true,
            "message" => "Reserva actualizada correctamente",
            "id" => $id,
            "estado" => $estado,
            "estado_reserva" => $estado_reserva,
            "posicion" => $posicion
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
                    posicion_lista_espera = 0,
                    observaciones = 'Reserva cancelada.'
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id" => $id
        ]);

        reordenarCola($pdo, $libro_id);
        actualizarEstadoLibroSegunSistema($pdo, $libro_id);

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