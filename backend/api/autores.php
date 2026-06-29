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

        if (isset($_POST["accion"]) && $_POST["accion"] == "editar") {

            actualizarAutor();

        } else {

            guardarAutor();

        }

        break;

    case "DELETE":
        eliminarAutor();
        break;

    default:

        echo json_encode([
            "success" => false,
            "message" => "Método no permitido.",
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
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage(),
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
            "data" => $stmt->fetch(PDO::FETCH_ASSOC),
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage(),
        ]);

    }
}

function guardarAutor()
{
    global $pdo;

    $nombre = $_POST["nombre"] ?? "";



    $nacionalidad = $_POST["nacionalidad"] ?? "";
    $fecha_nacimiento = $_POST["fecha_nacimiento"] ?? "";
    $biografia = $_POST["biografia"] ?? "";
    $estado = $_POST["estado"] ?? "Activo";

    $fotografia = "";

    if (isset($_FILES["fotografia"])) {

        $fotografia = time() . "_" . basename($_FILES["fotografia"]["name"]);

        $ruta = "../../frontend/img/autores/" . $fotografia;

        move_uploaded_file(
            $_FILES["fotografia"]["tmp_name"],
            $ruta
        );

    }

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

        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":nacionalidad", $nacionalidad);
        $stmt->bindParam(":fecha_nacimiento", $fecha_nacimiento);
        $stmt->bindParam(":biografia", $biografia);
        $stmt->bindParam(":fotografia", $fotografia);
        $stmt->bindParam(":estado", $estado);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Autor registrado correctamente.",
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage(),
        ]);

    }
}

function actualizarAutor()
{
    global $pdo;

    $id = $_POST["id"];
    $nombre = $_POST["nombre"];
    $nacionalidad = $_POST["nacionalidad"];
    $fecha_nacimiento = $_POST["fecha_nacimiento"];
    $biografia = $_POST["biografia"];
    $estado = $_POST["estado"];

    try {

        // Obtener la fotografía actual

        $sql = "SELECT fotografia FROM autores WHERE id=:id";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(":id", $id);

        $stmt->execute();

        $autor = $stmt->fetch(PDO::FETCH_ASSOC);

        $fotografia = $autor["fotografia"];

        // Si seleccionó una nueva fotografía

        if (isset($_FILES["fotografia"]) && $_FILES["fotografia"]["error"] == 0) {

            $fotografia = time() . "_" . basename($_FILES["fotografia"]["name"]);

            move_uploaded_file(
                $_FILES["fotografia"]["tmp_name"],
                "../../frontend/img/autores/" . $fotografia
            );

        }

        $sql = "UPDATE autores SET

                nombre=:nombre,
                nacionalidad=:nacionalidad,
                fecha_nacimiento=:fecha_nacimiento,
                biografia=:biografia,
                fotografia=:fotografia,
                estado=:estado

                WHERE id=:id";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":nacionalidad", $nacionalidad);
        $stmt->bindParam(":fecha_nacimiento", $fecha_nacimiento);
        $stmt->bindParam(":biografia", $biografia);
        $stmt->bindParam(":fotografia", $fotografia);
        $stmt->bindParam(":estado", $estado);

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Autor actualizado correctamente.",
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage(),
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
            "message" => "Autor eliminado correctamente.",
        ]);

    } catch (PDOException $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage(),
        ]);

    }
}
