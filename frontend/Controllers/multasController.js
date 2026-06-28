$(document).ready(function () {
    const API = "../../backend/api/multas.php";

    let modoEdicion = false;

    cargarCatalogos();
    listarMultas();
    actualizarMonto();

    $("#formMulta").on("submit", function (e) {
        e.preventDefault();
        guardarMulta();
    });

    $("#tipoMulta, #fechaDevolucion, #diasGracia").on("input change", function () {
        actualizarMonto();
    });

    $("#btnLimpiarFormulario").on("click", function () {
        limpiarFormulario();
        $("#mensajeFormulario").hide();
    });

    $(document).on("click", ".btnEditarMulta", function () {
        const id = $(this).data("id");
        cargarMulta(id);
    });

    function cargarCatalogos() {
        $.ajax({
            url: API + "?accion=catalogos",
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

                $("#idUsuario").html(usuarios);
                $("#idLibro").html(libros);
                actualizarMonto();
            },
            error: function () {
                mostrarMensaje("No se pudieron cargar los catálogos.", "error");
            }
        });
    }

    function guardarMulta() {
        const multa = {
            id_usuario: $("#idUsuario").val(),
            id_libro: $("#idLibro").val(),
            fecha_devolucion: $("#fechaDevolucion").val(),
            dias_gracia: $("#diasGracia").val(),
            tipo: $("#tipoMulta").val()
        };

        if (multa.id_usuario === "" || multa.id_libro === "" || multa.fecha_devolucion === "") {
            mostrarMensaje("Debe completar los campos obligatorios.", "error");
            return;
        }

        if (modoEdicion) {
            multa.id = $("#idMulta").val();
        }

        $.ajax({
            url: API,
            method: modoEdicion ? "PUT" : "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(multa),
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensaje(respuesta.message, "exito");
                    limpiarFormulario();
                    listarMultas();
                    modoEdicion = false;
                    $("#tituloFormulario").text("Registrar Multa");
                    $("#subtituloFormulario").text("Complete la información para registrar o modificar una multa.");
                    $("#btnGuardar").text("Guardar");
                } else {
                    mostrarMensaje(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                let mensaje = "No se pudo guardar la multa.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    mensaje = xhr.responseJSON.message;
                }
                mostrarMensaje(mensaje, "error");
            }
        });
    }

    function listarMultas() {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                let filas = "";

                if (respuesta.success) {
                    $.each(respuesta.data, function (i, multa) {
                        filas += `
                            <tr>
                                <td>${multa.id}</td>
                                <td>${multa.usuario}</td>
                                <td>${multa.libro}</td>
                                <td>${multa.fecha_devolucion}</td>
                                <td>${multa.dias_gracia}</td>
                                <td>${multa.tipo}</td>
                                <td>S/ ${formatearMonto(calcularMontoDesdeFila(multa))}</td>
                                <td>
                                    <button class="btn btn-secondary btnEditarMulta" data-id="${multa.id}">
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }

                $("#tbodyMultas").html(filas);
            },
            error: function () {
                mostrarMensaje("No se pudieron cargar las multas.", "error");
            }
        });
    }

    function cargarMulta(id) {
        $.ajax({
            url: API + "?id=" + encodeURIComponent(id),
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (!respuesta.success || !respuesta.data) {
                    mostrarMensaje("No se pudo cargar la multa seleccionada.", "error");
                    return;
                }

                const multa = respuesta.data;

                $("#idMulta").val(multa.id);
                $("#idUsuario").val(multa.id_usuario);
                $("#idLibro").val(multa.id_libro);
                $("#fechaDevolucion").val(String(multa.fecha_devolucion).slice(0, 10));
                $("#diasGracia").val(multa.dias_gracia);
                $("#tipoMulta").val(multa.tipo);
                actualizarMonto();

                modoEdicion = true;
                $("#tituloFormulario").text("Editar Multa");
                $("#subtituloFormulario").text("Modifique los datos del registro seleccionado.");
                $("#btnGuardar").text("Actualizar");
                window.scrollTo({ top: 0, behavior: "smooth" });
            },
            error: function () {
                mostrarMensaje("No se pudo cargar la multa seleccionada.", "error");
            }
        });
    }

    function limpiarFormulario() {
        $("#idMulta").val("");
        $("#idUsuario").val("");
        $("#idLibro").val("");
        $("#fechaDevolucion").val("");
        $("#diasGracia").val("");
        $("#tipoMulta").val("Atraso");
        $("#montoMulta").val("0.00");
        modoEdicion = false;
        $("#tituloFormulario").text("Registrar Multa");
        $("#subtituloFormulario").text("Complete la información para registrar o modificar una multa.");
        $("#btnGuardar").text("Guardar");
        actualizarMonto();
    }

    function actualizarMonto() {
        const tipo = $("#tipoMulta").val();
        const fechaDevolucion = $("#fechaDevolucion").val();
        const diasGracia = parseInt($("#diasGracia").val(), 10) || 0;

        const monto = calcularMonto(tipo, fechaDevolucion, diasGracia);
        $("#montoMulta").val(formatearMonto(monto));
    }

    function calcularMonto(tipo, fechaDevolucion, diasGracia) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let daysLate = 0;

        if (fechaDevolucion) {
            const fecha = new Date(fechaDevolucion + "T00:00:00");
            fecha.setHours(0, 0, 0, 0);

            const diffMs = hoy - fecha;
            if (diffMs > 0) {
                daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }
        }

        const diasCobro = Math.max(daysLate - diasGracia, 1);

        let fixedFee = 1000;

        if (tipo === "Daño") {
            fixedFee = 3000;
        }

        if (tipo === "Perdida") {
            fixedFee = 10000;
        }

        return fixedFee * diasCobro;
    }

    function calcularMontoDesdeFila(multa) {
        const tipo = multa.tipo || "Atraso";
        const fechaDevolucion = multa.fecha_devolucion ? String(multa.fecha_devolucion).slice(0, 10) : "";
        const diasGracia = parseInt(multa.dias_gracia, 10) || 0;
        return calcularMonto(tipo, fechaDevolucion, diasGracia);
    }

    function formatearMonto(monto) {
        return Number(monto || 0).toFixed(2);
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
