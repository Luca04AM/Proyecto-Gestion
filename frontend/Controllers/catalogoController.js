$(document).ready(function () {

    let libros = [];
    let paginaActual = 1;
    const librosPorPagina = 4;

    cargarLibros();

    $("#btnBuscar").click(function () {
        paginaActual = 1;
        cargarLibros($("#txtBuscar").val().trim());
    });

    $("#txtBuscar").keypress(function (e) {
        if (e.which === 13) {
            paginaActual = 1;
            cargarLibros($("#txtBuscar").val().trim());
        }
    });

    $("#selectEstado").change(function () {
        paginaActual = 1;
        mostrarLibros();
    });

    $("#btnLimpiar").click(function () {
        $("#txtBuscar").val("");
        $("#selectEstado").val("");
        paginaActual = 1;
        cargarLibros();
    });

    $("#btnAnterior").click(function () {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarLibros();
        }
    });

    $("#btnSiguiente").click(function () {
        const librosFiltrados = filtrarPorEstado();
        const totalPaginas = Math.ceil(librosFiltrados.length / librosPorPagina);

        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarLibros();
        }
    });

    function cargarLibros(buscar = "") {
        let url = "../../backend/api/libros.php";

        if (buscar !== "") {
            url += "?buscar=" + encodeURIComponent(buscar);
        }

        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    libros = respuesta.data;
                    mostrarLibros();
                } else {
                    mostrarMensajeVacio();
                }
            },
            error: function () {
                mostrarMensajeVacio();
                alert("No se pudo conectar con el API de libros.");
            }
        });
    }

    function filtrarPorEstado() {
        const estadoSeleccionado = $("#selectEstado").val();

        if (estadoSeleccionado === "") {
            return libros;
        }

        return libros.filter(function (libro) {
            return libro.estado === estadoSeleccionado;
        });
    }

    function mostrarLibros() {
        const tbody = $("#tbodyLibros");
        const tabla = $("#tablaCatalogo");
        const mensaje = $("#mensajeCatalogo");

        tbody.empty();

        const librosFiltrados = filtrarPorEstado();

        if (librosFiltrados.length === 0) {
            tabla.hide();
            mensaje.show();
            $("#paginaActual").text("0");
            return;
        }

        tabla.show();
        mensaje.hide();

        const inicio = (paginaActual - 1) * librosPorPagina;
        const fin = inicio + librosPorPagina;
        const librosPagina = librosFiltrados.slice(inicio, fin);

        librosPagina.forEach(function (libro) {

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
                </tr>
            `;

            tbody.append(fila);
        });

        const totalPaginas = Math.ceil(librosFiltrados.length / librosPorPagina);
        $("#paginaActual").text(paginaActual + " / " + totalPaginas);
    }

    function mostrarMensajeVacio() {
        $("#tbodyLibros").empty();
        $("#tablaCatalogo").hide();
        $("#mensajeCatalogo").show();
        $("#paginaActual").text("0");
    }

});