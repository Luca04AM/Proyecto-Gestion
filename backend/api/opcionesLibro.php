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
    $sqlAutores = "SELECT id, nombre 
                   FROM autores 
                   WHERE estado = 'Activo'
                   ORDER BY nombre ASC";

    $stmtAutores = $pdo->prepare($sqlAutores);
    $stmtAutores->execute();
    $autores = $stmtAutores->fetchAll(PDO::FETCH_ASSOC);

    $sqlGeneros = "SELECT id, nombre 
                   FROM generos 
                   WHERE estado = 'Activo'
                   ORDER BY nombre ASC";

    $stmtGeneros = $pdo->prepare($sqlGeneros);
    $stmtGeneros->execute();
    $generos = $stmtGeneros->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "autores" => $autores,
        "generos" => $generos
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al cargar las opciones",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}