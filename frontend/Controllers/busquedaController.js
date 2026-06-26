$(document).ready(function () {

    $("#tablaBusqueda").hide();

    $("#btnBuscarLibro").on("click", function () {
        ejecutarBusqueda();
    });

    $("#txtBusqueda").on("keypress", function (e) {
        if (e.which === 13) {
            ejecutarBusqueda();
        }
    });

    $("#btnLimpiarBusqueda").on("click", function () {
        $("#txtBusqueda").val("");
        $("#tipoBusqueda").val("general");
        $("#tbodyBusqueda").empty();
        $("#tablaBusqueda").hide();
        $("#mensajeBusqueda").hide();
    });

    function ejecutarBusqueda() {
        const texto = $("#txtBusqueda").val().trim();

        if (texto === "") {
            mostrarMensaje("Debe ingresar un término para realizar la búsqueda.");
            return;
        }

        $.ajax({
            url: "../../backend/api/libros.php?buscar=" + encodeURIComponent(texto),
            type: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    let resultados = respuesta.data;
                    resultados = filtrarPorTipo(resultados, texto);

                    mostrarResultados(resultados);
                } else {
                    mostrarMensaje("No se encontraron resultados.");
                }
            },
            error: function () {
                mostrarMensaje("No se pudo conectar con el API de libros.");
            }
        });
    }

    function filtrarPorTipo(libros, texto) {
        const tipo = $("#tipoBusqueda").val();
        const termino = texto.toLowerCase();

        if (tipo === "titulo") {
            return libros.filter(function (libro) {
                return libro.titulo.toLowerCase().includes(termino);
            });
        }

        if (tipo === "autor") {
            return libros.filter(function (libro) {
                return libro.autor.toLowerCase().includes(termino);
            });
        }

        return libros;
    }

    function mostrarResultados(libros) {
        const tbody = $("#tbodyBusqueda");

        tbody.empty();

        if (libros.length === 0) {
            mostrarMensaje("No se encontraron resultados.");
            return;
        }

        $("#mensajeBusqueda").hide();
        $("#tablaBusqueda").show();

        libros.forEach(function (libro) {

            let claseEstado = "badge-disponible";

            if (libro.estado === "Prestado") {
                claseEstado = "badge-prestado";
            }

            if (libro.estado === "Reservado") {
                claseEstado = "badge-reservado";
            }

            const portada = libro.portada
                ? `<img src="../img/catalogo/${libro.portada}" class="mini-portada" alt="Portada del libro">`
                : `<div class="portada-placeholder">📘</div>`;

            const fila = `
                <tr>
                    <td>${portada}</td>
                    <td>${libro.titulo}</td>
                    <td>${libro.autor}</td>
                    <td>${libro.genero}</td>
                    <td>
                        <span class="badge ${claseEstado}">
                            ${libro.estado}
                        </span>
                    </td>
                    <td>
                        <a href="detalleLibro.html?id=${libro.id}" class="btn btn-secondary">
                            Ver detalle
                        </a>
                    </td>
                </tr>
            `;

            tbody.append(fila);
        });
    }

    function mostrarMensaje(texto) {
        $("#tbodyBusqueda").empty();
        $("#tablaBusqueda").hide();

        $("#mensajeBusqueda")
            .show()
            .find("p")
            .text(texto);
    }

});