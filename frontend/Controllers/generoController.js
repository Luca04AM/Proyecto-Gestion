$(document).ready(function () {
    const API = "../../backend/api/generos.php";
    let generos = [];

    listarGeneros();

    $("#formGenero").on("submit", function (event) {
        event.preventDefault();

        const id = Number($("#txtIdGenero").val()) || 0;
        const data = {
            id,
            nombre: $("#txtNombreGenero").val().trim(),
            descripcion: $("#txtDescripcionGenero").val().trim(),
            estado: $("#txtEstadoGenero").val()
        };

        if (!data.nombre || !data.descripcion) {
            mostrarAlerta("Complete el nombre y la descripción.", "error");
            return;
        }

        $.ajax({
            url: API,
            method: id ? "PUT" : "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(data),
            success: function (respuesta) {
                mostrarAlerta(respuesta.message, "success");
                limpiarFormulario();
                listarGeneros();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "error");
            }
        });
    });

    $("#formGenero").on("reset", function () {
        setTimeout(limpiarFormulario, 0);
    });

    $("#txtBuscarGenero").on("input", function () {
        const texto = $(this).val().trim().toLowerCase();
        renderizarGeneros(generos.filter(function (genero) {
            return genero.nombre.toLowerCase().includes(texto)
                || genero.descripcion.toLowerCase().includes(texto);
        }));
    });

    $(document).on("click", ".btnEditarGenero", function () {
        const id = Number($(this).data("id"));
        const genero = generos.find(function (item) {
            return Number(item.id) === id;
        });

        if (!genero) {
            return;
        }

        $("#txtIdGenero").val(genero.id);
        $("#txtNombreGenero").val(genero.nombre);
        $("#txtDescripcionGenero").val(genero.descripcion);
        $("#txtEstadoGenero").val(genero.estado);
        $("#btnGuardarGenero").text("Actualizar género");
        $("html, body").animate({ scrollTop: $("#formGenero").offset().top - 130 }, 350);
    });

    $(document).on("click", ".btnEliminarGenero", function () {
        const id = Number($(this).data("id"));

        if (!confirm("¿Desea eliminar este género?")) {
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
                listarGeneros();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "error");
            }
        });
    });

    function listarGeneros() {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                generos = respuesta.data || [];
                renderizarGeneros(generos);
                actualizarResumen();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "error");
                renderizarGeneros([]);
            }
        });
    }

    function renderizarGeneros(lista) {
        if (!lista.length) {
            $("#tablaGeneros").html('<tr><td colspan="5" class="estado-vacio">No hay géneros para mostrar.</td></tr>');
            return;
        }

        const filas = lista.map(function (genero) {
            const claseEstado = genero.estado === "Activo" ? "badge-disponible" : "badge-atrasado";

            return `
                <tr>
                    <td>${Number(genero.id)}</td>
                    <td>${escapar(genero.nombre)}</td>
                    <td>${escapar(genero.descripcion)}</td>
                    <td><span class="badge ${claseEstado}">${escapar(genero.estado)}</span></td>
                    <td>
                        <div class="acciones-tabla">
                            <button type="button" class="btn btn-secondary btnEditarGenero" data-id="${Number(genero.id)}">Editar</button>
                            <button type="button" class="btn btn-accent btnEliminarGenero" data-id="${Number(genero.id)}">Eliminar</button>
                        </div>
                    </td>
                </tr>`;
        }).join("");

        $("#tablaGeneros").html(filas);
    }

    function actualizarResumen() {
        $("#totalGeneros").text(String(generos.length).padStart(2, "0"));
        $("#totalGenerosActivos").text(String(generos.filter(function (item) {
            return item.estado === "Activo";
        }).length).padStart(2, "0"));
    }

    function limpiarFormulario() {
        $("#formGenero")[0].reset();
        $("#txtIdGenero").val("");
        $("#btnGuardarGenero").text("Guardar género");
    }

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaGenero")
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
