$(document).ready(function () {
    const API = "../../backend/api/portadas.php";
    const API_LIBROS = "../../backend/api/libros.php";
    const IMAGEN_INICIAL = "../img/libros/1.jpg";
    let portadas = [];
    let urlVistaPrevia = null;

    cargarLibros();
    listarPortadas();

    $("#txtImagenPortada").on("change", function () {
        const archivo = this.files[0];

        if (!archivo) {
            restaurarVistaPrevia();
            return;
        }

        if (!archivo.type.match(/^image\/(jpeg|png|webp)$/)) {
            mostrarAlerta("Seleccione una imagen JPG, PNG o WEBP.", "error");
            $(this).val("");
            restaurarVistaPrevia();
            return;
        }

        if (urlVistaPrevia) {
            URL.revokeObjectURL(urlVistaPrevia);
        }

        urlVistaPrevia = URL.createObjectURL(archivo);
        $("#previewPortada").attr("src", urlVistaPrevia);
        $("#nombrePortada").text(archivo.name);
    });

    $("#formPortada").on("submit", function (event) {
        event.preventDefault();

        const id = Number($("#txtIdPortada").val()) || 0;
        const archivo = $("#txtImagenPortada")[0].files[0];

        if (!$("#txtLibroPortada").val()) {
            mostrarAlerta("Seleccione el libro asociado a la portada.", "error");
            return;
        }

        if (!id && !archivo) {
            mostrarAlerta("Seleccione una imagen de portada.", "error");
            return;
        }

        const data = new FormData();
        data.append("id", id);
        data.append("accion", id ? "editar" : "guardar");
        data.append("id_libro", $("#txtLibroPortada").val());
        data.append("estado", $("#txtEstadoPortada").val());
        data.append("es_predeterminada", $("#txtPredeterminadaPortada").is(":checked") ? "1" : "0");

        if (archivo) {
            data.append("imagen", archivo);
        }

        $.ajax({
            url: API,
            method: "POST",
            data,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function (respuesta) {
                mostrarAlerta(respuesta.message, "success");
                limpiarFormulario();
                listarPortadas();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "error");
            }
        });
    });

    $("#formPortada").on("reset", function () {
        setTimeout(limpiarFormulario, 0);
    });

    $(document).on("click", ".btnEditarPortada", function () {
        const id = Number($(this).data("id"));
        const portada = portadas.find(function (item) {
            return Number(item.id) === id;
        });

        if (!portada) {
            return;
        }

        $("#txtIdPortada").val(portada.id);
        $("#txtLibroPortada").val(portada.id_libro);
        $("#txtEstadoPortada").val(portada.estado);
        $("#txtPredeterminadaPortada").prop("checked", Number(portada.es_predeterminada) === 1);
        $("#previewPortada").attr("src", portada.ruta_archivo);
        $("#nombrePortada").text(portada.nombre_archivo + " (seleccione otra imagen para reemplazarla)");
        $("#btnGuardarPortada").text("Actualizar portada");
        $("html, body").animate({ scrollTop: $("#formPortada").offset().top - 130 }, 350);
    });

    $(document).on("click", ".btnEliminarPortada", function () {
        const id = Number($(this).data("id"));

        if (!confirm("¿Desea eliminar esta portada?")) {
            return;
        }

        $.ajax({
            url: API,
            method: "DELETE",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({ id }),
            success: function (respuesta) {
                mostrarAlerta(respuesta.message, "success");
                listarPortadas();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "error");
            }
        });
    });

    function cargarLibros() {
        $.ajax({
            url: API_LIBROS,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                const libros = respuesta.data || [];
                const opciones = libros.map(function (libro) {
                    return `<option value="${Number(libro.id)}">${escapar(libro.titulo)}</option>`;
                }).join("");

                $("#txtLibroPortada").html('<option value="">Seleccione un libro</option>' + opciones);
            },
            error: function () {
                mostrarAlerta("No fue posible cargar el catálogo de libros.", "error");
            }
        });
    }

    function listarPortadas() {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                portadas = respuesta.data || [];
                renderizarPortadas();
                actualizarResumen();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "error");
                $("#tablaPortadas").html('<tr><td colspan="6" class="estado-vacio">No fue posible cargar las portadas.</td></tr>');
            }
        });
    }

    function renderizarPortadas() {
        if (!portadas.length) {
            $("#tablaPortadas").html('<tr><td colspan="6" class="estado-vacio">No hay portadas registradas.</td></tr>');
            return;
        }

        const filas = portadas.map(function (portada) {
            const claseEstado = portada.estado === "Activo" ? "badge-disponible" : "badge-atrasado";
            const predeterminada = Number(portada.es_predeterminada) === 1 ? "Sí" : "No";

            return `
                <tr>
                    <td>${Number(portada.id)}</td>
                    <td>${escapar(portada.libro)}</td>
                    <td><img class="thumb-img" src="${escapar(portada.ruta_archivo)}" alt="Portada de ${escapar(portada.libro)}"></td>
                    <td>${predeterminada}</td>
                    <td><span class="badge ${claseEstado}">${escapar(portada.estado)}</span></td>
                    <td>
                        <div class="acciones-tabla">
                            <button type="button" class="btn btn-secondary btnEditarPortada" data-id="${Number(portada.id)}">Editar</button>
                            <button type="button" class="btn btn-accent btnEliminarPortada" data-id="${Number(portada.id)}">Eliminar</button>
                        </div>
                    </td>
                </tr>`;
        }).join("");

        $("#tablaPortadas").html(filas);
    }

    function actualizarResumen() {
        $("#totalPortadas").text(String(portadas.length).padStart(2, "0"));
        $("#totalPortadasActivas").text(String(portadas.filter(function (item) {
            return item.estado === "Activo";
        }).length).padStart(2, "0"));
    }

    function limpiarFormulario() {
        $("#formPortada")[0].reset();
        $("#txtIdPortada").val("");
        $("#btnGuardarPortada").text("Guardar portada");
        restaurarVistaPrevia();
    }

    function restaurarVistaPrevia() {
        if (urlVistaPrevia) {
            URL.revokeObjectURL(urlVistaPrevia);
            urlVistaPrevia = null;
        }
        $("#previewPortada").attr("src", IMAGEN_INICIAL);
        $("#nombrePortada").text("Vista previa de la portada");
    }

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaPortada")
            .removeClass("alerta-success alerta-error")
            .addClass("alerta alerta-" + tipo)
            .text(mensaje)
            .attr("hidden", false);
    }

    function obtenerMensajeError(xhr) {
        return xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : "No fue posible conectar con el servidor.";
    }

    function escapar(valor) {
        return $("<div>").text(valor == null ? "" : valor).html();
    }
});
