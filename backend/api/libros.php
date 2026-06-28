<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

try {

    if ($method === "GET") {

        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
        $buscar = isset($_GET["buscar"]) ? trim($_GET["buscar"]) : "";

        if ($id > 0) {
            $sql = "SELECT id, titulo, autor, genero, descripcion, portada, estado, condicion, fecha_registro
                    FROM libros
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([":id" => $id]);

            $libro = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($libro) {
                echo json_encode([
                    "success" => true,
                    "data" => $libro
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "El libro no existe"
                ], JSON_UNESCAPED_UNICODE);
            }

            exit;
        }

        if ($buscar !== "") {
            $sql = "SELECT id, titulo, autor, genero, descripcion, portada, estado, condicion, fecha_registro
                    FROM libros
                    WHERE titulo LIKE :buscar
                       OR autor LIKE :buscar
                       OR genero LIKE :buscar
                    ORDER BY titulo ASC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ":buscar" => "%" . $buscar . "%"
            ]);
        } else {
            $sql = "SELECT id, titulo, autor, genero, descripcion, portada, estado, condicion, fecha_registro
                    FROM libros
                    ORDER BY titulo ASC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute();
        }

        $libros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "cantidad" => count($libros),
            "data" => $libros
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if ($method === "POST") {

        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input) {
            $input = $_POST;
        }

        $titulo = isset($input["titulo"]) ? trim($input["titulo"]) : "";
        $autor = isset($input["autor"]) ? trim($input["autor"]) : "";
        $genero = isset($input["genero"]) ? trim($input["genero"]) : "";
        $descripcion = isset($input["descripcion"]) ? trim($input["descripcion"]) : "";
        $portada = isset($input["portada"]) ? trim($input["portada"]) : "";
        $estado = isset($input["estado"]) ? trim($input["estado"]) : "Disponible";
        $condicion = isset($input["condicion"]) ? trim($input["condicion"]) : "Excelente";

        if ($titulo === "" || $autor === "" || $genero === "" || $descripcion === "" || $condicion === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Debe completar los campos obligatorios"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $estadosPermitidos = ["Disponible", "Prestado", "Reservado", "No disponible"];

        if (!in_array($estado, $estadosPermitidos)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El estado del libro no es válido"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sqlValidar = "SELECT id FROM libros 
                       WHERE titulo = :titulo 
                       AND autor = :autor";

        $stmtValidar = $pdo->prepare($sqlValidar);
        $stmtValidar->execute([
            ":titulo" => $titulo,
            ":autor" => $autor
        ]);

        if ($stmtValidar->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "message" => "El libro ya existe en el catálogo"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "INSERT INTO libros 
                (titulo, autor, genero, descripcion, portada, estado, condicion)
                VALUES 
                (:titulo, :autor, :genero, :descripcion, :portada, :estado, :condicion)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":titulo" => $titulo,
            ":autor" => $autor,
            ":genero" => $genero,
            ":descripcion" => $descripcion,
            ":portada" => $portada,
            ":estado" => $estado,
            ":condicion" => $condicion
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Libro registrado correctamente",
            "id" => $pdo->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if ($method === "PUT") {

        $input = json_decode(file_get_contents("php://input"), true);

        $id = isset($input["id"]) ? intval($input["id"]) : 0;
        $titulo = isset($input["titulo"]) ? trim($input["titulo"]) : "";
        $autor = isset($input["autor"]) ? trim($input["autor"]) : "";
        $genero = isset($input["genero"]) ? trim($input["genero"]) : "";
        $descripcion = isset($input["descripcion"]) ? trim($input["descripcion"]) : "";
        $portada = isset($input["portada"]) ? trim($input["portada"]) : "";
        $estado = isset($input["estado"]) ? trim($input["estado"]) : "Disponible";
        $condicion = isset($input["condicion"]) ? trim($input["condicion"]) : "Excelente";

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El id del libro es obligatorio"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($titulo === "" || $autor === "" || $genero === "" || $descripcion === "" || $condicion === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Debe completar los campos obligatorios"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sqlExiste = "SELECT id FROM libros WHERE id = :id";
        $stmtExiste = $pdo->prepare($sqlExiste);
        $stmtExiste->execute([":id" => $id]);

        if (!$stmtExiste->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "El libro que desea editar no existe"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sqlDuplicado = "SELECT id FROM libros
                         WHERE titulo = :titulo
                         AND autor = :autor
                         AND id <> :id";

        $stmtDuplicado = $pdo->prepare($sqlDuplicado);
        $stmtDuplicado->execute([
            ":titulo" => $titulo,
            ":autor" => $autor,
            ":id" => $id
        ]);

        if ($stmtDuplicado->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "message" => "Ya existe otro libro con el mismo título y autor"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "UPDATE libros
                SET titulo = :titulo,
                    autor = :autor,
                    genero = :genero,
                    descripcion = :descripcion,
                    portada = :portada,
                    estado = :estado,
                    condicion = :condicion
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":titulo" => $titulo,
            ":autor" => $autor,
            ":genero" => $genero,
            ":descripcion" => $descripcion,
            ":portada" => $portada,
            ":estado" => $estado,
            ":condicion" => $condicion,
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Libro actualizado correctamente"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if ($method === "DELETE") {

        $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "El id del libro es obligatorio"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sqlExiste = "SELECT id FROM libros WHERE id = :id";
        $stmtExiste = $pdo->prepare($sqlExiste);
        $stmtExiste->execute([":id" => $id]);

        if (!$stmtExiste->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "El libro que desea eliminar no existe"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "DELETE FROM libros WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([":id" => $id]);

        echo json_encode([
            "success" => true,
            "message" => "Libro eliminado correctamente"
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
        "message" => "Error en el proceso",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}