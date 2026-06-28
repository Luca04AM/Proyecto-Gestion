$(document).ready(function () {

    const API = "../../backend/api/multas.php";

    let modoEdicion = false;

    cargarCatalogos();
    listarMultas();

    $("#formMulta").on("submit", function (e) {
        e.preventDefault();
        guardarMulta();
    });

    $("#tipoMulta, #diasRetraso, #diasGracia").on("input change", function () {
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

    $(document).on("click", ".btnVoucherMulta", function () {
        generarVoucher({
            id: $(this).data("id"),
            usuario: $(this).data("usuario"),
            libro: $(this).data("libro"),
            fecha_devolucion: $(this).data("fecha"),
            dias_retraso: $(this).data("retraso"),
            dias_gracia: $(this).data("gracia"),
            monto: $(this).data("monto"),
            estado: $(this).data("estado"),
            tipo: $(this).data("tipo")
        });
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
            },
            error: function () {
                mostrarMensaje("No se pudieron cargar los catálogos.", "error");
            }
        });
    }

    function guardarMulta() {
        actualizarMonto();

        const multa = {
            id_usuario: $("#idUsuario").val(),
            id_libro: $("#idLibro").val(),
            fecha_devolucion: $("#fechaDevolucion").val(),
            dias_retraso: $("#diasRetraso").val(),
            dias_gracia: $("#diasGracia").val(),
            monto: $("#montoMulta").val(),
            estado: $("#estadoMulta").val(),
            tipo: $("#tipoMulta").val()
        };

        if (
            multa.id_usuario === "" ||
            multa.id_libro === "" ||
            multa.fecha_devolucion === ""
        ) {
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
                                <td>${multa.dias_retraso}</td>
                                <td>${multa.dias_gracia}</td>
                                <td>S/ ${Number(multa.monto).toFixed(2)}</td>
                                <td>
                                    <span class="badge ${multa.estado === "Pagada" ? "badge-disponible" : "badge-prestado"}">
                                        ${multa.estado}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-secondary btnEditarMulta" data-id="${multa.id}">
                                        Editar
                                    </button>
                                    ${multa.estado === "Pagada" ? `
                                        <button
                                            class="btn btn-primary btnVoucherMulta"
                                            data-id="${multa.id}"
                                            data-usuario="${multa.usuario}"
                                            data-libro="${multa.libro}"
                                            data-fecha="${multa.fecha_devolucion}"
                                            data-retraso="${multa.dias_retraso}"
                                            data-gracia="${multa.dias_gracia}"
                                            data-monto="${multa.monto}"
                                            data-estado="${multa.estado}"
                                            data-tipo="${multa.tipo}"
                                        >
                                            Voucher
                                        </button>
                                    ` : ""}
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
                $("#diasRetraso").val(multa.dias_retraso);
                $("#diasGracia").val(multa.dias_gracia);
                $("#estadoMulta").val(multa.estado);
                $("#tipoMulta").val(multa.tipo);

                modoEdicion = true;
                $("#tituloFormulario").text("Editar Multa");
                $("#subtituloFormulario").text("Modifique los datos del registro seleccionado.");
                $("#btnGuardar").text("Actualizar");
                $("#tipoMulta").trigger("change");
                actualizarMonto();
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
        $("#diasRetraso").val("");
        $("#diasGracia").val("");
        $("#montoMulta").val("");
        $("#estadoMulta").val("Pendiente");
        $("#tipoMulta").val("Atraso");
        actualizarMonto();
        modoEdicion = false;
        $("#tituloFormulario").text("Registrar Multa");
        $("#subtituloFormulario").text("Complete la información para registrar o modificar una multa.");
        $("#btnGuardar").text("Guardar");
    }

    function actualizarMonto() {
        const tipo = $("#tipoMulta").val();
        const diasRetraso = parseInt($("#diasRetraso").val(), 10) || 0;
        const diasGracia = parseInt($("#diasGracia").val(), 10) || 0;

        let montoBase = 0;

        if (tipo === "Atraso") {
            montoBase = 1000;
        }

        if (tipo === "Daño") {
            montoBase = 3000;
        }

        if (tipo === "Perdida") {
            montoBase = 10000;
        }

        const diasCobro = Math.max(diasRetraso - diasGracia, 1);
        const monto = montoBase * diasCobro;

        $("#montoMulta").val(monto.toFixed(2));
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

    function generarVoucher(multa) {
        const pdf = new window.jspdf.jsPDF();
        const fechaGeneracion = new Date().toLocaleString("es-CR");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("SIGAB Libros", 20, 20);

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text("Comprobante de multa pagada", 20, 32);
        pdf.text(`Fecha de generación: ${fechaGeneracion}`, 20, 42);
        pdf.text(`ID de multa: ${multa.id}`, 20, 54);
        pdf.text(`Usuario: ${multa.usuario}`, 20, 64);
        pdf.text(`Libro: ${multa.libro}`, 20, 74);
        pdf.text(`Fecha de devolución: ${multa.fecha_devolucion}`, 20, 84);
        pdf.text(`Días de retraso: ${multa.dias_retraso}`, 20, 94);
        pdf.text(`Días de gracia: ${multa.dias_gracia}`, 20, 104);
        pdf.text(`Tipo: ${multa.tipo}`, 20, 114);
        pdf.text(`Estado: ${multa.estado}`, 20, 124);
        pdf.text(`Monto pagado: S/ ${Number(multa.monto).toFixed(2)}`, 20, 134);

        pdf.setFontSize(10);
        pdf.text("Documento generado automáticamente por SIGAB Libros.", 20, 150);

        pdf.save(`voucher-multa-${multa.id}.pdf`);
    }

});
