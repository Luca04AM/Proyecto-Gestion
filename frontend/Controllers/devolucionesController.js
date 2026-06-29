$(document).ready(function () {
    const API = "../../backend/api/devoluciones.php";
    const API_PRESTAMOS = "../../backend/api/prestamos.php";
    let enviandoDevolucion = false;

    cargarPrestamosActivos();
    cargarDevoluciones();

    $("#formDevolucion").on("submit", function (e) {
        e.preventDefault();
        if (enviandoDevolucion) {
            return;
        }
        registrarDevolucion();
    });

    $("#formConsultaDevoluciones").on("submit", function (e) {
        e.preventDefault();
        cargarDevoluciones();
    });

    $("#btnLimpiarConsulta").on("click", function () {
        $("#txtUsuario").val("");
        $("#txtLibro").val("");
        cargarDevoluciones();
    });

    $("#prestamoDevolucion").on("change", function () {
        const idPrestamo = $(this).val();

        if (!idPrestamo) {
            limpiarFormulario();
            return;
        }

        cargarDetallePrestamo(idPrestamo);
    });

    function cargarPrestamosActivos() {
        $.ajax({
            url: API_PRESTAMOS + "?accion=pendientes",
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                let opciones = '<option value="">Seleccione un préstamo</option>';

                if (respuesta.success) {
                    $.each(respuesta.data, function (i, prestamo) {
                        opciones += `<option value="${prestamo.id}">${prestamo.usuario} - ${prestamo.libro}</option>`;
                    });
                }

                $("#prestamoDevolucion").html(opciones);
            },
            error: function () {
                $("#prestamoDevolucion").html('<option value="">No se pudieron cargar los préstamos</option>');
            }
        });
    }

    function cargarDetallePrestamo(idPrestamo) {
        $.ajax({
            url: API_PRESTAMOS + "?id=" + encodeURIComponent(idPrestamo),
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (!respuesta.success || !respuesta.data) {
                    limpiarFormulario();
                    return;
                }

                const prestamo = respuesta.data;
                const fechaPrestamo = String(prestamo.fecha_prestamo).slice(0, 10);
                const fechaDevolucion = String(prestamo.fecha_devolucion).slice(0, 10);

                $("#idPrestamo").val(prestamo.id);
                $("#idLibro").val(prestamo.id_libro);
                $("#usuarioDevolucion").val(prestamo.usuario);
                $("#libroDevolucion").val(prestamo.libro);
                $("#fechaPrestamo").val(fechaPrestamo);
                $("#fechaDevolucion").val(fechaDevolucion);
                $("#fechaDevuelto").val(new Date().toISOString().slice(0, 10));
            },
            error: function () {
                limpiarFormulario();
            }
        });
    }

    function registrarDevolucion() {
        const idPrestamo = $("#idPrestamo").val();
        const fechaDevuelto = $("#fechaDevuelto").val();
        const observaciones = $("#observaciones").val().trim();
        const estadoLibro = $("#estadoLibro").val();

        enviandoDevolucion = true;
        $("#formDevolucion button[type='submit']").prop("disabled", true);

        $.ajax({
            url: API,
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                id_prestamo: idPrestamo,
                fecha_devuelto: fechaDevuelto,
                observaciones: observaciones,
                estado_libro: estadoLibro
            }),
            success: function (respuesta) {
                if (respuesta.success) {
                    alert(respuesta.message);
                    limpiarFormulario();
                    cargarPrestamosActivos();
                    cargarDevoluciones();
                } else {
                    alert(respuesta.message || "No se pudo registrar la devolución.");
                }
                enviandoDevolucion = false;
                $("#formDevolucion button[type='submit']").prop("disabled", false);
            },
            error: function (xhr) {
                const respuesta = xhr.responseJSON || {};
                alert(respuesta.message || "No se pudo registrar la devolución.");
                enviandoDevolucion = false;
                $("#formDevolucion button[type='submit']").prop("disabled", false);
            }
        });
    }

    function cargarDevoluciones() {
        const usuario = $("#txtUsuario").val().trim();
        const libro = $("#txtLibro").val().trim();

        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            data: {
                buscar_usuario: usuario,
                buscar_libro: libro
            },
            success: function (respuesta) {
                if (respuesta.success) {
                    renderizarTabla(respuesta.data);
                } else {
                    renderizarTabla([]);
                }
            },
            error: function () {
                renderizarTabla([]);
            }
        });
    }

    function renderizarTabla(devoluciones) {
        const tbody = $("#tablaDevoluciones");
        tbody.empty();

        if (!devoluciones || devoluciones.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="5" class="text-center">No existen devoluciones registradas.</td>
                </tr>
            `);
            return;
        }

        devoluciones.forEach(function (devolucion) {
            const fechaDevuelto = devolucion.fecha_devuelto ? String(devolucion.fecha_devuelto).slice(0, 10) : "-";

            tbody.append(`
                <tr>
                    <td>${devolucion.id}</td>
                    <td>${devolucion.usuario}</td>
                    <td>${devolucion.libro}</td>
                    <td>${fechaDevuelto}</td>
                    <td>${devolucion.observaciones || "-"}</td>
                </tr>
            `);
        });
    }

    function limpiarFormulario() {
        $("#idPrestamo").val("");
        $("#idLibro").val("");
        $("#usuarioDevolucion").val("");
        $("#libroDevolucion").val("");
        $("#fechaPrestamo").val("");
        $("#fechaDevolucion").val("");
        $("#fechaDevuelto").val("");
        $("#observaciones").val("");
        $("#estadoLibro").val("Excelente");
        $("#prestamoDevolucion").val("");
    }
});
