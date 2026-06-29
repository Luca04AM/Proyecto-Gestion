$(document).ready(function () {

    const parametros = new URLSearchParams(window.location.search);
    const idLibro = parametros.get("id");

    if (!idLibro) {
        mostrarError();
        return;
    }

    cargarDetalleLibro(idLibro);

    function cargarDetalleLibro(id) {
        $.ajax({
            url: "../../backend/api/libros.php?id=" + encodeURIComponent(id),
            type: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarDetalle(respuesta.data);
                } else {
                    mostrarError();
                }
            },
            error: function () {
                mostrarError();
            }
        });
    }

    function mostrarDetalle(libro) {
        $("#contenidoDetalle").show();
        $("#mensajeDetalle").hide();

        $("#detalleTitulo").text(libro.titulo);
        $("#detalleAutor").text(libro.autor);
        $("#detalleGenero").text(libro.genero);
        $("#detalleDescripcion").text(libro.descripcion);
        $("#detalleCondicion").text(libro.condicion || "No especificada");

        let claseEstado = "badge-disponible";

        if (libro.estado === "Prestado") {
            claseEstado = "badge-prestado";
        }

        if (libro.estado === "Reservado") {
            claseEstado = "badge-reservado";
        }

        if (libro.estado === "No disponible") {
            claseEstado = "badge-no-disponible";
        }

        $("#detalleEstado")
            .removeClass()
            .addClass("badge " + claseEstado)
            .text(libro.estado);

        if (libro.portada) {
            $("#detallePortada")
                .attr("src", "../img/catalogo/" + libro.portada)
                .attr("alt", "Portada de " + libro.titulo);
        } else {
            $("#detallePortada")
                .attr("src", "../img/autores/subir.png")
                .attr("alt", "Sin portada disponible");
        }
    }

    function mostrarError() {
        $("#contenidoDetalle").hide();
        $("#mensajeDetalle").show();
    }

});