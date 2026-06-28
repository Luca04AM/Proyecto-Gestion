<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {
    case "GET":
        if (isset($_GET["id"])) {
            obtenerPrestamo($_GET["id"]);
            break;
        }

        if (isset($_GET["accion"]) && $_GET["accion"] === "catalogos") {
            obtenerCatalogos(isset($_GET["id"]) ? intval($_GET["id"]) : 0);
            break;
        }

        if (isset($_GET["accion"]) && $_GET["accion"] === "activos") {
            listarPrestamosActivos();
            break;
        }

        listarPrestamos();
        break;

    case "POST":
        guardarPrestamo();
        break;

    case "PUT":
        if (isset($_GET["accion"]) && $_GET["accion"] === "renovar") {
            renovarPrestamo();
            break;
        }

        if (isset($_GET["accion"]) && $_GET["accion"] === "actualizar_estados") {
            actualizarEstadosPrestamo();
            break;
        }

        actualizarPrestamo();
        break;

    default:
        http_response_code(405);
        echo json_encode([
            "success" => false,
            "message" => "Método no permitido"
        ], JSON_UNESCAPED_UNICODE);
        break;
}

function listarPrestamos()
{
    global $pdo;

    try {
        $sql = "SELECT p.id, p.id_usuario, p.id_libro, p.fecha_prestamo, p.fecha_devolucion, p.estado,
                       u.nombre AS usuario, l.titulo AS libro, l.estado AS estado_libro
                FROM prestamos p
                INNER JOIN usuarios u ON u.id = p.id_usuario
                INNER JOIN libros l ON l.id = p.id_libro
                ORDER BY p.id DESC";

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

function obtenerPrestamo($id)
{
    global $pdo;

    try {
        $sql = "SELECT p.id, p.id_usuario, p.id_libro, p.fecha_prestamo, p.fecha_devolucion, p.estado,
                       u.nombre AS usuario, l.titulo AS libro, l.estado AS estado_libro
                FROM prestamos p
                INNER JOIN usuarios u ON u.id = p.id_usuario
                INNER JOIN libros l ON l.id = p.id_libro
                WHERE p.id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
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


function listarPrestamosActivos()
{
    global $pdo;

    try {
        $sql = "SELECT p.id, p.id_usuario, p.id_libro, p.fecha_prestamo, p.fecha_devolucion, p.estado,
                       u.nombre AS usuario, l.titulo AS libro
                FROM prestamos p
                INNER JOIN usuarios u ON u.id = p.id_usuario
                INNER JOIN libros l ON l.id = p.id_libro
                WHERE p.estado = 'Prestado'
                ORDER BY p.id DESC";

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

function obtenerCatalogos($idPrestamo = 0)
{
    global $pdo;

    try {
        $sqlUsuarios = "SELECT u.id, u.nombre
                        FROM usuarios u
                        WHERE u.estado = 'Activo'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM multas m
                              WHERE m.id_usuario = u.id
                                AND m.estado <> 'Pagada'
                          )
                        ORDER BY u.nombre ASC";
        $stmtUsuarios = $pdo->prepare($sqlUsuarios);
        $stmtUsuarios->execute();
        $usuarios = $stmtUsuarios->fetchAll(PDO::FETCH_ASSOC);

        $sqlLibros = "SELECT l.id, l.titulo
                      FROM libros l
                      WHERE l.estado = 'Disponible'
                      ORDER BY l.titulo ASC";
        $stmtLibros = $pdo->prepare($sqlLibros);
        $stmtLibros->execute();
        $libros = $stmtLibros->fetchAll(PDO::FETCH_ASSOC);

        if ($idPrestamo > 0) {
            $sqlActual = "SELECT id_usuario, id_libro FROM prestamos WHERE id = :id";
            $stmtActual = $pdo->prepare($sqlActual);
            $stmtActual->execute([":id" => $idPrestamo]);
            $actual = $stmtActual->fetch(PDO::FETCH_ASSOC);

            if ($actual) {
                $stmtUsuarioActual = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE id = :id");
                $stmtUsuarioActual->execute([":id" => $actual["id_usuario"]]);
                $usuarioActual = $stmtUsuarioActual->fetch(PDO::FETCH_ASSOC);
                if ($usuarioActual) {
                    $existeUsuario = false;
                    foreach ($usuarios as $usuario) {
                        if ((int) $usuario["id"] === (int) $usuarioActual["id"]) {
                            $existeUsuario = true;
                            break;
                        }
                    }
                    if (!$existeUsuario) {
                        $usuarios[] = $usuarioActual;
                    }
                }

                $stmtLibroActual = $pdo->prepare("SELECT id, titulo FROM libros WHERE id = :id");
                $stmtLibroActual->execute([":id" => $actual["id_libro"]]);
                $libroActual = $stmtLibroActual->fetch(PDO::FETCH_ASSOC);
                if ($libroActual) {
                    $existeLibro = false;
                    foreach ($libros as $libro) {
                        if ((int) $libro["id"] === (int) $libroActual["id"]) {
                            $existeLibro = true;
                            break;
                        }
                    }
                    if (!$existeLibro) {
                        $libros[] = $libroActual;
                    }
                }
            }
        }

        echo json_encode([
            "success" => true,
            "data" => [
                "usuarios" => $usuarios,
                "libros" => $libros
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

function guardarPrestamo()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        $data = $_POST;
    }

    $id_usuario = isset($data["id_usuario"]) ? intval($data["id_usuario"]) : 0;
    $id_libro = isset($data["id_libro"]) ? intval($data["id_libro"]) : 0;
    $estado_libro = isset($data["estado_libro"]) ? trim($data["estado_libro"]) : "";
    $fecha_prestamo = isset($data["fecha_prestamo"]) ? trim($data["fecha_prestamo"]) : "";
    $fecha_devolucion = isset($data["fecha_devolucion"]) ? trim($data["fecha_devolucion"]) : "";
    $estado = isset($data["estado"]) ? trim($data["estado"]) : "Prestado";

    if ($id_usuario <= 0 || $id_libro <= 0 || $estado_libro === "" || $fecha_prestamo === "" || $fecha_devolucion === "" || $estado === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe completar los campos obligatorios."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!in_array($estado_libro, ["Reservado", "Prestado"], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un estado de libro válido."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!in_array($estado, ["Devuelto", "Prestado", "Perdido"], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un estado de préstamo válido."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        if (usuarioTieneMultasPendientes($pdo, $id_usuario)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El usuario tiene multas pendientes y no puede registrar un préstamo."
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!libroDisponible($pdo, $id_libro)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El libro debe estar en estado Disponible para registrar el préstamo."
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $pdo->beginTransaction();

        $sql = "INSERT INTO prestamos
                (id_usuario, id_libro, fecha_prestamo, fecha_devolucion, estado)
                VALUES
                (:id_usuario, :id_libro, :fecha_prestamo, :fecha_devolucion, :estado)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id_usuario" => $id_usuario,
            ":id_libro" => $id_libro,
            ":fecha_prestamo" => $fecha_prestamo,
            ":fecha_devolucion" => $fecha_devolucion,
            ":estado" => $estado
        ]);

        actualizarEstadoLibro($pdo, $id_libro, $estado_libro);

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Préstamo registrado correctamente."
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function actualizarEstadosPrestamo()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        $data = $_POST;
    }

    $id = isset($data["id"]) ? intval($data["id"]) : 0;
    $estado_libro = isset($data["estado_libro"]) ? trim($data["estado_libro"]) : "";
    $estado = isset($data["estado"]) ? trim($data["estado"]) : "";

    if ($id <= 0 || $estado_libro === "" || $estado === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe completar los campos obligatorios."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!in_array($estado_libro, ["Reservado", "Prestado"], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un estado de libro válido."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!in_array($estado, ["Devuelto", "Prestado", "Perdido"], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un estado de préstamo válido."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE prestamos SET estado = :estado WHERE id = :id");
        $stmt->execute([
            ":id" => $id,
            ":estado" => $estado
        ]);

        $stmtLibro = $pdo->prepare("SELECT id_libro FROM prestamos WHERE id = :id");
        $stmtLibro->execute([":id" => $id]);
        $prestamo = $stmtLibro->fetch(PDO::FETCH_ASSOC);

        if ($prestamo) {
            $estadoLibroFinal = ($estado === "Devuelto") ? "Disponible" : $estado_libro;
            actualizarEstadoLibro($pdo, intval($prestamo["id_libro"]), $estadoLibroFinal);
        }

        echo json_encode([
            "success" => true,
            "message" => "Préstamo actualizado correctamente."
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function renovarPrestamo()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        $data = $_POST;
    }

    $id = isset($data["id"]) ? intval($data["id"]) : 0;
    $fecha_devolucion = isset($data["fecha_devolucion"]) ? trim($data["fecha_devolucion"]) : "";

    if ($id <= 0 || $fecha_devolucion === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un préstamo y una nueva fecha de devolución."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE prestamos SET fecha_devolucion = :fecha_devolucion WHERE id = :id");
        $stmt->execute([
            ":id" => $id,
            ":fecha_devolucion" => $fecha_devolucion
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Préstamo renovado correctamente."
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function actualizarPrestamo()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);

    $id = isset($data["id"]) ? intval($data["id"]) : 0;
    $id_usuario = isset($data["id_usuario"]) ? intval($data["id_usuario"]) : 0;
    $id_libro = isset($data["id_libro"]) ? intval($data["id_libro"]) : 0;
    $estado_libro = isset($data["estado_libro"]) ? trim($data["estado_libro"]) : "";
    $fecha_prestamo = isset($data["fecha_prestamo"]) ? trim($data["fecha_prestamo"]) : "";
    $fecha_devolucion = isset($data["fecha_devolucion"]) ? trim($data["fecha_devolucion"]) : "";
    $estado = isset($data["estado"]) ? trim($data["estado"]) : "Prestado";

    if ($id <= 0 || $id_usuario <= 0 || $id_libro <= 0 || $estado_libro === "" || $fecha_prestamo === "" || $fecha_devolucion === "" || $estado === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe completar los campos obligatorios."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!in_array($estado_libro, ["Reservado", "Prestado"], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un estado de libro válido."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!in_array($estado, ["Devuelto", "Prestado", "Perdido"], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Debe seleccionar un estado de préstamo válido."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $stmtActual = $pdo->prepare("SELECT id_usuario, id_libro FROM prestamos WHERE id = :id");
        $stmtActual->execute([":id" => $id]);
        $actual = $stmtActual->fetch(PDO::FETCH_ASSOC);

        if (!$actual) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "El préstamo no existe."
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (usuarioTieneMultasPendientes($pdo, $id_usuario)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El usuario tiene multas pendientes y no puede registrar un préstamo."
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ((int) $actual["id_libro"] !== $id_libro && !libroDisponible($pdo, $id_libro)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El libro debe estar en estado Disponible para registrar el préstamo."
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $pdo->beginTransaction();

        $sql = "UPDATE prestamos
                SET id_usuario = :id_usuario,
                    id_libro = :id_libro,
                    fecha_prestamo = :fecha_prestamo,
                    fecha_devolucion = :fecha_devolucion,
                    estado = :estado
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id" => $id,
            ":id_usuario" => $id_usuario,
            ":id_libro" => $id_libro,
            ":fecha_prestamo" => $fecha_prestamo,
            ":fecha_devolucion" => $fecha_devolucion,
            ":estado" => $estado
        ]);

        actualizarEstadoLibro($pdo, $id_libro, $estado_libro);

        if ((int) $actual["id_libro"] !== $id_libro) {
            $stmtLibroAnterior = $pdo->prepare("UPDATE libros SET estado = 'Disponible' WHERE id = :id");
            $stmtLibroAnterior->execute([":id" => $actual["id_libro"]]);
        }

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Préstamo actualizado correctamente."
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function usuarioTieneMultasPendientes($pdo, $idUsuario)
{
    $sql = "SELECT COUNT(*) AS total
            FROM multas
            WHERE id_usuario = :id_usuario
              AND estado <> 'Pagada'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([":id_usuario" => $idUsuario]);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    return isset($resultado["total"]) && intval($resultado["total"]) > 0;
}

function libroDisponible($pdo, $idLibro)
{
    $sql = "SELECT estado FROM libros WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([":id" => $idLibro]);
    $libro = $stmt->fetch(PDO::FETCH_ASSOC);

    return $libro && $libro["estado"] === "Disponible";
}

function actualizarEstadoLibro($pdo, $idLibro, $estadoLibro)
{
    $sql = "UPDATE libros SET estado = :estado WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":estado" => $estadoLibro,
        ":id" => $idLibro
    ]);
}
