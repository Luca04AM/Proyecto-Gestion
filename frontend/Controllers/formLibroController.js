$(document).ready(function () {

    $("#formLibro").submit(function (e) {
        e.preventDefault();

        const libro = {
            titulo: $("#titulo").val().trim(),
            autor: $("#autor").val().trim(),
            genero: $("#genero").val().trim(),
            descripcion: $("#descripcion").val().trim(),
            portada: $("#portada").val().trim(),
            estado: $("#estado").val()
        };

        if (
            libro.titulo === "" ||
            libro.autor === "" ||
            libro.genero === "" ||
            libro.descripcion === ""
        ) {
            mostrarMensaje("Debe completar todos los campos obligatorios.", "error");
            return;
        }

        $.ajax({
            url: "../../backend/api/libros.php",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(libro),
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensaje(respuesta.message, "exito");
                    limpiarFormulario();
                } else {
                    mostrarMensaje(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                let mensaje = "No se pudo registrar el libro.";

                if (xhr.responseJSON && xhr.responseJSON.message) {
                    mensaje = xhr.responseJSON.message;
                }

                mostrarMensaje(mensaje, "error");
            }
        });
    });

    $("#btnLimpiarFormulario").click(function () {
        limpiarFormulario();
        $("#mensajeFormulario").hide();
    });

    function limpiarFormulario() {
        $("#titulo").val("");
        $("#autor").val("");
        $("#genero").val("");
        $("#descripcion").val("");
        $("#portada").val("");
        $("#estado").val("Disponible");
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