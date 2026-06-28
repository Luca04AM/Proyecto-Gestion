$(document).ready(function () {
    const API = "../../backend/api/prestamos.php";

    let modoEdicion = false;

    cargarCatalogos();
    listarPrestamos();
    listarPrestamosActivosRenovacion();
    establecerFechasPorDefecto();

    $("#formPrestamo").on("submit", function (e) {
        e.preventDefault();
        guardarPrestamo();
    });

    $("#formRenovacion").on("submit", function (e) {
        e.preventDefault();
        renovarPrestamo();
    });

    $("#prestamoRenovar").on("change", function () {
        const seleccionado = $(this).find(":selected");
        $("#nuevaFecha").val(seleccionado.data("fecha") || "");
    });

    $(document).on("click", ".btnEditarPrestamo", function () {
        abrirModalEdicion($(this).data("id"), $(this).data("estado-libro"), $(this).data("estado-prestamo"));
    });

    $("#btnGuardarEdicionPrestamo").on("click", function () {
        guardarEdicionPrestamo();
    });

    function abrirModalEdicion(id, estadoLibro, estadoPrestamo) {
        $("#editarPrestamoId").val(id);
        $("#editarEstadoLibro").val(estadoLibro || "Prestado");
        $("#editarEstadoPrestamo").val(estadoPrestamo || "Prestado");
        mostrarMensajeEdicion("", "exito", true);
        const modal = new bootstrap.Modal(document.getElementById("modalEditarPrestamo"));
        modal.show();
    }

    function guardarEdicionPrestamo() {
        const id = $("#editarPrestamoId").val();
        const estadoLibro = $("#editarEstadoLibro").val();
        const estadoPrestamo = $("#editarEstadoPrestamo").val();

        if (id === "" || estadoLibro === "" || estadoPrestamo === "") {
            mostrarMensajeEdicion("Debe completar los campos obligatorios.", "error");
            return;
        }

        $.ajax({
            url: API + "?accion=actualizar_estados",
            method: "PUT",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                id: id,
                estado_libro: estadoLibro,
                estado: estadoPrestamo
            }),
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensajeEdicion(respuesta.message, "exito");
                    listarPrestamos();
                    listarPrestamosActivosRenovacion();
                    cargarCatalogos();
                    const modalEl = document.getElementById("modalEditarPrestamo");
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) {
                        modal.hide();
                    }
                } else {
                    mostrarMensajeEdicion(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                const mensaje = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : "No se pudo actualizar el préstamo.";
                mostrarMensajeEdicion(mensaje, "error");
            }
        });
    }

    function cargarCatalogos(idPrestamo = "", callback = null) {
        let url = API + "?accion=catalogos";
        if (idPrestamo !== "") {
            url += "&id=" + encodeURIComponent(idPrestamo);
        }

        $.ajax({
            url: url,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (!respuesta.success) {
                    mostrarMensaje("No se pudieron cargar los catálogos.", "error");
                    return;
                }

                let usuarios = '<option value="">Seleccione un usuario</option>';
                let libros = '<option value="">Seleccione un libro</option>';

                $.each(respuesta.data.usuarios, function (i, usuario) {
                    usuarios += `<option value="${usuario.id}">${usuario.nombre}</option>`;
                });

                $.each(respuesta.data.libros, function (i, libro) {
                    libros += `<option value="${libro.id}">${libro.titulo}</option>`;
                });

                $("#usuarioPrestamo").html(usuarios);
                $("#libroPrestamo").html(libros);

                if (typeof callback === "function") {
                    callback();
                }
            },
            error: function () {
                mostrarMensaje("No se pudieron cargar los catálogos.", "error");
            }
        });
    }

    function listarPrestamos() {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                let filas = "";

                if (respuesta.success) {
                    $.each(respuesta.data, function (i, prestamo) {
                        filas += `
                            <tr>
                                <td>${prestamo.id}</td>
                                <td>${prestamo.usuario}</td>
                                <td>${prestamo.libro}</td>
                                <td>${prestamo.fecha_prestamo}</td>
                                <td>${prestamo.fecha_devolucion}</td>
                                <td>${prestamo.estado_libro}</td>
                                <td>${prestamo.estado}</td>
                                <td>
                                    <button class="btn btn-secondary btnEditarPrestamo"
                                            data-id="${prestamo.id}"
                                            data-estado-libro="${prestamo.estado_libro}"
                                            data-estado-prestamo="${prestamo.estado}">
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }

                $("#tablaPrestamos").html(filas);
            },
            error: function () {
                mostrarMensaje("No se pudieron cargar los préstamos.", "error");
            }
        });
    }

    function listarPrestamosActivosRenovacion() {
        $.ajax({
            url: API + "?accion=activos",
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                let opciones = '<option value="">Seleccione un préstamo</option>';

                if (respuesta.success) {
                    $.each(respuesta.data, function (i, prestamo) {
                        const nuevaFecha = sumarDias(prestamo.fecha_devolucion, 15);
                        opciones += `<option value="${prestamo.id}" data-fecha="${nuevaFecha}">#${prestamo.id} - ${prestamo.usuario} - ${prestamo.libro}</option>`;
                    });
                }

                $("#prestamoRenovar").html(opciones);
            },
            error: function () {
                mostrarMensajeRenovacion("No se pudieron cargar los préstamos activos.", "error");
            }
        });
    }

    function guardarPrestamo() {
        const prestamo = {
            id_usuario: $("#usuarioPrestamo").val(),
            id_libro: $("#libroPrestamo").val(),
            estado_libro: $("#estadoLibro").val(),
            fecha_prestamo: $("#fechaPrestamo").val(),
            fecha_devolucion: $("#fechaDevolucion").val(),
            estado: $("#estadoPrestamo").val()
        };

        if (
            prestamo.id_usuario === "" ||
            prestamo.id_libro === "" ||
            prestamo.estado_libro === "" ||
            prestamo.fecha_prestamo === "" ||
            prestamo.fecha_devolucion === "" ||
            prestamo.estado === ""
        ) {
            mostrarMensaje("Debe completar los campos obligatorios.", "error");
            return;
        }

        if (modoEdicion) {
            prestamo.id = $("#idPrestamo").val();
        }

        $.ajax({
            url: API,
            method: modoEdicion ? "PUT" : "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(prestamo),
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensaje(respuesta.message, "exito");
                    limpiarFormulario();
                    listarPrestamos();
                    listarPrestamosActivosRenovacion();
                    cargarCatalogos();
                    modoEdicion = false;
                } else {
                    mostrarMensaje(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                const mensaje = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : "No se pudo guardar el préstamo.";
                mostrarMensaje(mensaje, "error");
            }
        });
    }

    function renovarPrestamo() {
        const idPrestamo = $("#prestamoRenovar").val();
        const fechaDevolucion = $("#nuevaFecha").val();

        if (idPrestamo === "" || fechaDevolucion === "") {
            mostrarMensajeRenovacion("Debe seleccionar un préstamo y una nueva fecha de devolución.", "error");
            return;
        }

        $.ajax({
            url: API + "?accion=renovar",
            method: "PUT",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                id: idPrestamo,
                fecha_devolucion: fechaDevolucion
            }),
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensajeRenovacion(respuesta.message, "exito");
                    listarPrestamos();
                    listarPrestamosActivosRenovacion();
                    $("#prestamoRenovar").val("");
                    $("#nuevaFecha").val("");
                } else {
                    mostrarMensajeRenovacion(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                const mensaje = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : "No se pudo renovar el préstamo.";
                mostrarMensajeRenovacion(mensaje, "error");
            }
        });
    }

    function cargarPrestamo(id) {
        $.ajax({
            url: API + "?id=" + encodeURIComponent(id),
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (!respuesta.success || !respuesta.data) {
                    mostrarMensaje("No se pudo cargar el préstamo seleccionado.", "error");
                    return;
                }

                const prestamo = respuesta.data;

                cargarCatalogos(prestamo.id, function () {
                    $("#idPrestamo").val(prestamo.id);
                    $("#usuarioPrestamo").val(prestamo.id_usuario);
                    $("#libroPrestamo").val(prestamo.id_libro);
                    $("#estadoLibro").val(prestamo.estado_libro || "Prestado");
                    $("#fechaPrestamo").val(String(prestamo.fecha_prestamo).slice(0, 10));
                    $("#fechaDevolucion").val(String(prestamo.fecha_devolucion).slice(0, 10));
                    $("#estadoPrestamo").val(prestamo.estado || "Prestado");
                    modoEdicion = true;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                });
            },
            error: function () {
                mostrarMensaje("No se pudo cargar el préstamo seleccionado.", "error");
            }
        });
    }

    function limpiarFormulario() {
        $("#idPrestamo").val("");
        $("#usuarioPrestamo").val("");
        $("#libroPrestamo").val("");
        $("#estadoLibro").val("Prestado");
        $("#estadoPrestamo").val("Prestado");
        establecerFechasPorDefecto();
        modoEdicion = false;
    }

    function establecerFechasPorDefecto() {
        const hoy = new Date();
        const fechaPrestamo = hoy.toISOString().slice(0, 10);
        const fechaDevolucion = new Date(hoy);
        fechaDevolucion.setDate(fechaDevolucion.getDate() + 15);

        $("#fechaPrestamo").val(fechaPrestamo);
        $("#fechaDevolucion").val(fechaDevolucion.toISOString().slice(0, 10));
        $("#estadoLibro").val("Prestado");
        $("#estadoPrestamo").val("Prestado");
    }

    function sumarDias(fechaISO, dias) {
        const fecha = new Date(String(fechaISO).slice(0, 10) + "T00:00:00");
        fecha.setDate(fecha.getDate() + dias);
        return fecha.toISOString().slice(0, 10);
    }

    function mostrarMensaje(texto, tipo) {
        const mensaje = $("#msgPrestamo");
        mensaje.removeClass("mensaje-exito mensaje-error");
        mensaje.addClass(tipo === "exito" ? "mensaje-exito" : "mensaje-error");
        mensaje.text(texto);
        mensaje.attr("style", "display:block;");
    }

    function mostrarMensajeEdicion(texto, tipo, limpiar = false) {
        const mensaje = $("#msgEdicionPrestamo");
        mensaje.removeClass("mensaje-exito mensaje-error");

        if (limpiar) {
            mensaje.text("");
            mensaje.attr("style", "display:block;");
            return;
        }

        mensaje.addClass(tipo === "exito" ? "mensaje-exito" : "mensaje-error");
        mensaje.text(texto);
        mensaje.attr("style", "display:block;");
    }

    function mostrarMensajeRenovacion(texto, tipo) {
        const mensaje = $("#msgRenovacion");
        mensaje.removeClass("mensaje-exito mensaje-error");
        mensaje.addClass(tipo === "exito" ? "mensaje-exito" : "mensaje-error");
        mensaje.text(texto);
        mensaje.attr("style", "display:block;");
    }
});
