<?php

require_once "../config/headers.php";
require_once "../config/database.php";

function responderPortada($success, $message = "", $data = null, $status = 200)
{
    http_response_code($status);
    $response = ["success" => $success];

    if ($message !== "") {
        $response["message"] = $message;
    }

    if ($data !== null) {
        $response["data"] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

function leerEntradaPortada()
{
    $data = json_decode(file_get_contents("php://input"), true);
    return is_array($data) ? $data : $_POST;
}

function guardarArchivoPortada($archivo)
{
    if (!isset($archivo) || $archivo["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($archivo["error"] !== UPLOAD_ERR_OK) {
        responderPortada(false, "No fue posible recibir la imagen.", null, 400);
    }

    if ($archivo["size"] > 5 * 1024 * 1024) {
        responderPortada(false, "La imagen no puede superar 5 MB.", null, 400);
    }

    $mime = mime_content_type($archivo["tmp_name"]);
    $formatos = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp"
    ];

    if (!isset($formatos[$mime])) {
        responderPortada(false, "Solo se permiten imágenes JPG, PNG o WEBP.", null, 400);
    }

    $directorio = __DIR__ . "/../../frontend/img/portadas";

    if (!is_dir($directorio) && !mkdir($directorio, 0775, true)) {
        responderPortada(false, "No fue posible preparar la carpeta de portadas.", null, 500);
    }

    $nombre = bin2hex(random_bytes(10)) . "." . $formatos[$mime];
    $destino = $directorio . "/" . $nombre;

    if (!move_uploaded_file($archivo["tmp_name"], $destino)) {
        responderPortada(false, "No fue posible guardar la imagen.", null, 500);
    }

    return [
        "nombre" => $nombre,
        "ruta" => "../img/portadas/" . $nombre,
        "formato" => strtoupper($formatos[$mime]),
        "tamano" => (int) $archivo["size"]
    ];
}

function eliminarArchivoPortada($ruta)
{
    if (!$ruta || strpos($ruta, "../img/portadas/") !== 0) {
        return;
    }

    $archivo = __DIR__ . "/../../frontend/img/portadas/" . basename($ruta);

    if (is_file($archivo)) {
        unlink($archivo);
    }
}

function validarDatosPortada($data)
{
    $idLibro = (int) ($data["id_libro"] ?? 0);
    $estado = trim($data["estado"] ?? "Activo");
    $predeterminada = !empty($data["es_predeterminada"]) ? 1 : 0;

    if ($idLibro <= 0) {
        responderPortada(false, "Debe seleccionar un libro.", null, 400);
    }

    if (!in_array($estado, ["Activo", "Inactivo"], true)) {
        responderPortada(false, "El estado indicado no es válido.", null, 400);
    }

    return [$idLibro, $estado, $predeterminada];
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $id = isset($_GET["id"]) ? (int) $_GET["id"] : 0;
        $sql = "SELECT p.id, p.id_libro, l.titulo AS libro, p.nombre_archivo,
                       p.ruta_archivo, p.formato, p.tamano_archivo,
                       p.fecha_carga, p.fecha_actualizacion,
                       p.es_predeterminada, p.estado
                FROM portadas p
                INNER JOIN libros l ON l.id = p.id_libro";

        if ($id > 0) {
            $stmt = $pdo->prepare($sql . " WHERE p.id = :id");
            $stmt->execute([":id" => $id]);
            $portada = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$portada) {
                responderPortada(false, "La portada no existe.", null, 404);
            }

            responderPortada(true, "", $portada);
        }

        $stmt = $pdo->query($sql . " ORDER BY p.fecha_carga DESC");
        responderPortada(true, "", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($method === "POST") {
        $data = $_POST;
        $id = (int) ($data["id"] ?? 0);
        $esEdicion = ($data["accion"] ?? "") === "editar" || $id > 0;
        [$idLibro, $estado, $predeterminada] = validarDatosPortada($data);

        $libro = $pdo->prepare("SELECT id FROM libros WHERE id = :id");
        $libro->execute([":id" => $idLibro]);

        if (!$libro->fetch()) {
            responderPortada(false, "El libro seleccionado no existe.", null, 404);
        }

        $archivoNuevo = guardarArchivoPortada($_FILES["imagen"] ?? null);

        if (!$esEdicion && !$archivoNuevo) {
            responderPortada(false, "Debe seleccionar una imagen de portada.", null, 400);
        }

        $pdo->beginTransaction();

        if ($predeterminada) {
            $stmt = $pdo->prepare("UPDATE portadas SET es_predeterminada = 0 WHERE id_libro = :id_libro");
            $stmt->execute([":id_libro" => $idLibro]);
        }

        if ($esEdicion) {
            $actual = $pdo->prepare("SELECT * FROM portadas WHERE id = :id");
            $actual->execute([":id" => $id]);
            $portadaActual = $actual->fetch(PDO::FETCH_ASSOC);

            if (!$portadaActual) {
                $pdo->rollBack();
                if ($archivoNuevo) {
                    eliminarArchivoPortada($archivoNuevo["ruta"]);
                }
                responderPortada(false, "La portada que desea editar no existe.", null, 404);
            }

            $archivo = $archivoNuevo ?: [
                "nombre" => $portadaActual["nombre_archivo"],
                "ruta" => $portadaActual["ruta_archivo"],
                "formato" => $portadaActual["formato"],
                "tamano" => $portadaActual["tamano_archivo"]
            ];

            $stmt = $pdo->prepare(
                "UPDATE portadas
                 SET id_libro = :id_libro, nombre_archivo = :nombre_archivo,
                     ruta_archivo = :ruta_archivo, formato = :formato,
                     tamano_archivo = :tamano_archivo,
                     es_predeterminada = :es_predeterminada, estado = :estado
                 WHERE id = :id"
            );
            $stmt->execute([
                ":id" => $id,
                ":id_libro" => $idLibro,
                ":nombre_archivo" => $archivo["nombre"],
                ":ruta_archivo" => $archivo["ruta"],
                ":formato" => $archivo["formato"],
                ":tamano_archivo" => $archivo["tamano"],
                ":es_predeterminada" => $predeterminada,
                ":estado" => $estado
            ]);

            $pdo->commit();

            if ($archivoNuevo) {
                eliminarArchivoPortada($portadaActual["ruta_archivo"]);
            }

            responderPortada(true, "Portada actualizada correctamente.");
        }

        $stmt = $pdo->prepare(
            "INSERT INTO portadas
             (id_libro, nombre_archivo, ruta_archivo, formato, tamano_archivo, es_predeterminada, estado)
             VALUES
             (:id_libro, :nombre_archivo, :ruta_archivo, :formato, :tamano_archivo, :es_predeterminada, :estado)"
        );
        $stmt->execute([
            ":id_libro" => $idLibro,
            ":nombre_archivo" => $archivoNuevo["nombre"],
            ":ruta_archivo" => $archivoNuevo["ruta"],
            ":formato" => $archivoNuevo["formato"],
            ":tamano_archivo" => $archivoNuevo["tamano"],
            ":es_predeterminada" => $predeterminada,
            ":estado" => $estado
        ]);

        $nuevoId = $pdo->lastInsertId();
        $pdo->commit();
        responderPortada(true, "Portada registrada correctamente.", ["id" => $nuevoId], 201);
    }

    if ($method === "DELETE") {
        $data = leerEntradaPortada();
        $id = isset($_GET["id"]) ? (int) $_GET["id"] : (int) ($data["id"] ?? 0);

        if ($id <= 0) {
            responderPortada(false, "El id de la portada es obligatorio.", null, 400);
        }

        $stmt = $pdo->prepare("SELECT ruta_archivo FROM portadas WHERE id = :id");
        $stmt->execute([":id" => $id]);
        $portada = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$portada) {
            responderPortada(false, "La portada que desea eliminar no existe.", null, 404);
        }

        $stmt = $pdo->prepare("DELETE FROM portadas WHERE id = :id");
        $stmt->execute([":id" => $id]);
        eliminarArchivoPortada($portada["ruta_archivo"]);
        responderPortada(true, "Portada eliminada correctamente.");
    }

    responderPortada(false, "Método no permitido.", null, 405);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (isset($archivoNuevo) && $archivoNuevo) {
        eliminarArchivoPortada($archivoNuevo["ruta"]);
    }
    responderPortada(false, "Ocurrió un error al procesar las portadas.", null, 500);
}
