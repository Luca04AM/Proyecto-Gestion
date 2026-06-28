$(document).ready(function () {

    const parametros = new URLSearchParams(window.location.search);
    const idLibro = parametros.get("id");
    const modoEdicion = idLibro !== null;

    if (modoEdicion) {
        prepararFormularioEdicion(idLibro);
    }

    $("#formLibro").on("submit", function (e) {
        e.preventDefault();

        const libro = {
            titulo: $("#titulo").val().trim(),
            autor: $("#autor").val().trim(),
            genero: $("#genero").val().trim(),
            descripcion: $("#descripcion").val().trim(),
            portada: $("#portada").val().trim(),
            estado: $("#estado").val(),
            condicion: $("#condicion").val()
        };

        if (modoEdicion) {
            libro.id = $("#idLibro").val();
        }

        if (
            libro.titulo === "" ||
            libro.autor === "" ||
            libro.genero === "" ||
            libro.descripcion === "" ||
            libro.condicion === ""
        ) {
            mostrarMensaje("Debe completar todos los campos obligatorios.", "error");
            return;
        }

        const metodo = modoEdicion ? "PUT" : "POST";

        $.ajax({
            url: "../../backend/api/libros.php",
            type: metodo,
            contentType: "application/json",
            data: JSON.stringify(libro),
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensaje(respuesta.message, "exito");

                    if (!modoEdicion) {
                        limpiarFormulario();
                    }
                } else {
                    mostrarMensaje(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                let mensaje = "No se pudo guardar la información del libro.";

                if (xhr.responseJSON && xhr.responseJSON.message) {
                    mensaje = xhr.responseJSON.message;
                }

                mostrarMensaje(mensaje, "error");
            }
        });
    });

    $("#btnLimpiarFormulario").on("click", function () {
        limpiarFormulario();
        $("#mensajeFormulario").hide();
    });

    function prepararFormularioEdicion(id) {
        $("#tituloFormulario").text("Editar Libro");
        $("#subtituloFormulario").text("Modifique la información del libro seleccionado.");
        $("#btnGuardar").text("Guardar cambios");

        $.ajax({
            url: "../../backend/api/libros.php?id=" + encodeURIComponent(id),
            type: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    cargarDatosFormulario(respuesta.data);
                } else {
                    mostrarMensaje("El libro no existe.", "error");
                }
            },
            error: function () {
                mostrarMensaje("No se pudo cargar la información del libro.", "error");
            }
        });
    }

    function cargarDatosFormulario(libro) {
        $("#idLibro").val(libro.id);
        $("#titulo").val(libro.titulo);
        $("#autor").val(libro.autor);
        $("#genero").val(libro.genero);
        $("#descripcion").val(libro.descripcion);
        $("#portada").val(libro.portada);
        $("#estado").val(libro.estado);
        $("#condicion").val(libro.condicion || "Excelente");
    }

    function limpiarFormulario() {
        $("#titulo").val("");
        $("#autor").val("");
        $("#genero").val("");
        $("#descripcion").val("");
        $("#portada").val("");
        $("#estado").val("Disponible");
        $("#condicion").val("Excelente");
    }

    function mostrarMensaje(texto, tipo) {
        const mensaje = $("#mensajeFormulario");

        mensaje.removeClass("mensaje-exito mensaje-error");

        if (tipo === "exito") {
            mensaje.addClass("mensaje-exito");
        } else {
            mensaje.addClass("mensaje-error");
        }

        mensaje.text(texto);
        mensaje.attr("style", "display:block;");
    }

});