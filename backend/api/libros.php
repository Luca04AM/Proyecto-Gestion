<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

if ($method !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
    $buscar = isset($_GET["buscar"]) ? trim($_GET["buscar"]) : "";

    if ($id > 0) {
        $sql = "SELECT id, titulo, autor, genero, descripcion, portada, estado, fecha_registro
                FROM libros
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":id" => $id
        ]);

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
        $sql = "SELECT id, titulo, autor, genero, descripcion, portada, estado, fecha_registro
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
        $sql = "SELECT id, titulo, autor, genero, descripcion, portada, estado, fecha_registro
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

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al consultar los libros",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}