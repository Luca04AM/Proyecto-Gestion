<?php

require_once "../config/headers.php";
require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {

    case "GET":

        if (isset($_GET["id"])) {
            obtenerAutor($_GET["id"]);
        } else {
            listarAutores();
        }

        break;

    case "POST":
        guardarAutor();
        break;

    case "PUT":
        actualizarAutor();
        break;

    case "DELETE":
        eliminarAutor();
        break;

    default:

        echo json_encode([
            "success" => false,
            "message" => "Método no permitido."
        ]);

        break;
}

function listarAutores()
{
    global $pdo;

    try {

        $sql = "SELECT * FROM autores ORDER BY id DESC";

        $stmt = $pdo->prepare($sql);

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);

    }
}

function obtenerAutor($id)
{
    global $pdo;

    try {

        $sql = "SELECT * FROM autores WHERE id=:id";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(":id", $id);

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "data" => $stmt->fetch(PDO::FETCH_ASSOC)
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);

    }
}

function guardarAutor()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);

    try {

        $sql = "INSERT INTO autores
        (
            nombre,
            nacionalidad,
            fecha_nacimiento,
            biografia,
            fotografia,
            estado
        )
        VALUES
        (
            :nombre,
            :nacionalidad,
            :fecha_nacimiento,
            :biografia,
            :fotografia,
            :estado
        )";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(":nombre", $data["nombre"]);
        $stmt->bindParam(":nacionalidad", $data["nacionalidad"]);
        $stmt->bindParam(":fecha_nacimiento", $data["fecha_nacimiento"]);
        $stmt->bindParam(":biografia", $data["biografia"]);
        $stmt->bindParam(":fotografia", $data["fotografia"]);
        $stmt->bindParam(":estado", $data["estado"]);

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Autor registrado correctamente."
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);

    }
}

function actualizarAutor()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);

    try {

        $sql = "UPDATE autores SET

            nombre=:nombre,
            nacionalidad=:nacionalidad,
            fecha_nacimiento=:fecha_nacimiento,
            biografia=:biografia,
            fotografia=:fotografia,
            estado=:estado

            WHERE id=:id";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(":id", $data["id"]);
        $stmt->bindParam(":nombre", $data["nombre"]);
        $stmt->bindParam(":nacionalidad", $data["nacionalidad"]);
        $stmt->bindParam(":fecha_nacimiento", $data["fecha_nacimiento"]);
        $stmt->bindParam(":biografia", $data["biografia"]);
        $stmt->bindParam(":fotografia", $data["fotografia"]);
        $stmt->bindParam(":estado", $data["estado"]);

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Autor actualizado correctamente."
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);

    }
}

function eliminarAutor()
{
    global $pdo;

    $data = json_decode(file_get_contents("php://input"), true);

    try {

        $sql = "DELETE FROM autores WHERE id=:id";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(":id", $data["id"]);

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Autor eliminado correctamente."
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);

    }
}