<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

try {

    if ($method === "GET") {
        $buscarUsuario = isset($_GET["buscar_usuario"]) ? trim($_GET["buscar_usuario"]) : "";
        $buscarLibro = isset($_GET["buscar_libro"]) ? trim($_GET["buscar_libro"]) : "";

        $sql = "SELECT d.id, d.id_prestamo, d.fecha_devuelto, d.observaciones,
                       u.nombre AS usuario, l.titulo AS libro
                FROM devoluciones d
                INNER JOIN prestamos p ON p.id = d.id_prestamo
                INNER JOIN usuarios u ON u.id = p.id_usuario
                INNER JOIN libros l ON l.id = p.id_libro";

        $condiciones = [];
        $params = [];

        if ($buscarUsuario !== "") {
            $condiciones[] = "u.nombre LIKE :buscar_usuario";
            $params[":buscar_usuario"] = "%" . $buscarUsuario . "%";
        }

        if ($buscarLibro !== "") {
            $condiciones[] = "l.titulo LIKE :buscar_libro";
            $params[":buscar_libro"] = "%" . $buscarLibro . "%";
        }

        if (!empty($condiciones)) {
            $sql .= " WHERE " . implode(" AND ", $condiciones);
        }

        $sql .= " ORDER BY d.fecha_devuelto DESC, d.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $devoluciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "cantidad" => count($devoluciones),
            "data" => $devoluciones
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            $data = $_POST;
        }

        $id_prestamo = isset($data["id_prestamo"]) ? intval($data["id_prestamo"]) : 0;
        $fecha_devuelto = isset($data["fecha_devuelto"]) ? trim($data["fecha_devuelto"]) : "";
        $observaciones = isset($data["observaciones"]) ? trim($data["observaciones"]) : "";
        $estado_libro = isset($data["estado_libro"]) ? trim($data["estado_libro"]) : "Excelente";

        if ($id_prestamo <= 0 || $fecha_devuelto === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Debe completar los campos obligatorios."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmtPrestamo = $pdo->prepare("SELECT id, id_usuario, id_libro, fecha_devolucion FROM prestamos WHERE id = :id");
        $stmtPrestamo->execute([":id" => $id_prestamo]);
        $prestamo = $stmtPrestamo->fetch(PDO::FETCH_ASSOC);

        if (!$prestamo) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "El préstamo seleccionado no existe."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmtDevolucion = $pdo->prepare("SELECT id FROM devoluciones WHERE id_prestamo = :id_prestamo");
        $stmtDevolucion->execute([":id_prestamo" => $id_prestamo]);

        if ($stmtDevolucion->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "message" => "Este préstamo ya tiene una devolución registrada."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $pdo->beginTransaction();

        $sql = "INSERT INTO devoluciones (id_prestamo, fecha_devuelto, observaciones)
                VALUES (:id_prestamo, :fecha_devuelto, :observaciones)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id_prestamo" => $id_prestamo,
            ":fecha_devuelto" => $fecha_devuelto,
            ":observaciones" => $observaciones
        ]);

        $stmtActualizarPrestamo = $pdo->prepare("UPDATE prestamos SET estado = 'Devuelto' WHERE id = :id");
        $stmtActualizarPrestamo->execute([":id" => $id_prestamo]);

        $estadoLibroFinal = (mb_strtolower($estado_libro, "UTF-8") === "muy dañado") ? "No disponible" : "Disponible";

        $stmtActualizarLibro = $pdo->prepare("UPDATE libros SET estado = :estado, condicion = :condicion WHERE id = :id");
        $stmtActualizarLibro->execute([
            ":estado" => $estadoLibroFinal,
            ":condicion" => $estado_libro,
            ":id" => $prestamo["id_libro"]
        ]);

        $multasAInsertar = [];

        $fechaDevueltoObj = DateTime::createFromFormat("Y-m-d", $fecha_devuelto);
        $fechaDevolucionObj = DateTime::createFromFormat("Y-m-d", substr((string) $prestamo["fecha_devolucion"], 0, 10));

        if ($fechaDevueltoObj && $fechaDevolucionObj && $fechaDevueltoObj > $fechaDevolucionObj) {
            $diasRetraso = (int) $fechaDevolucionObj->diff($fechaDevueltoObj)->format("%a");

            if ($diasRetraso > 0) {
                $multasAInsertar[] = [
                    "tipo" => "Atraso",
                    "dias_retraso" => $diasRetraso,
                    "dias_gracia" => 0
                ];
            }
        }

        if (mb_strtolower($estado_libro, "UTF-8") === "dañado") {
            $multasAInsertar[] = [
                "tipo" => "Daño",
                "dias_retraso" => 0,
                "dias_gracia" => 0
            ];
        }

        if (mb_strtolower($estado_libro, "UTF-8") === "muy dañado") {
            $multasAInsertar[] = [
                "tipo" => "Perdida",
                "dias_retraso" => 0,
                "dias_gracia" => 0
            ];
        }

        if (!empty($multasAInsertar)) {
            $stmtMulta = $pdo->prepare("INSERT INTO multas
                (id_usuario, id_libro, fecha_devolucion, dias_gracia, tipo)
                VALUES
                (:id_usuario, :id_libro, :fecha_devolucion, :dias_gracia, :tipo)");

            foreach ($multasAInsertar as $multa) {
                $stmtMulta->execute([
                    ":id_usuario" => $prestamo["id_usuario"],
                    ":id_libro" => $prestamo["id_libro"],
                    ":fecha_devolucion" => $fecha_devuelto,
                    ":dias_gracia" => $multa["dias_gracia"],
                    ":tipo" => $multa["tipo"]
                ]);
            }
        }

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Devolución registrada correctamente."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
