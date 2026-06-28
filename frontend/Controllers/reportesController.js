$(document).ready(function () {
    const API = "../../backend/api/reportes.php";
    let reportes = [];

    establecerFechasIniciales();
    listarReportes();

    $(".formReporte").on("submit", function (event) {
        event.preventDefault();

        const form = $(this);
        const id = Number(form.find(".reporte-id").val()) || 0;
        const data = {
            id,
            id_usuario: form.find(".reporte-usuario").val().trim() || null,
            tipo_reporte: form.data("tipo"),
            fecha_inicio: form.find(".reporte-inicio").val(),
            fecha_fin: form.find(".reporte-fin").val(),
            estado: form.find(".reporte-estado").val()
        };

        if (!data.fecha_inicio || !data.fecha_fin) {
            mostrarAlerta("Seleccione el rango de fechas del reporte.", "danger");
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
                limpiarFormulario(form);
                listarReportes();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "danger");
            }
        });
    });

    $(document).on("click", ".btnEditarReporte", function () {
        const id = Number($(this).data("id"));
        const reporte = reportes.find(function (item) {
            return Number(item.id) === id;
        });

        if (!reporte) {
            return;
        }

        const form = $(`.formReporte[data-tipo="${reporte.tipo_reporte}"]`);
        form.find(".reporte-id").val(reporte.id);
        form.find(".reporte-usuario").val(reporte.id_usuario || "");
        form.find(".reporte-inicio").val(reporte.fecha_inicio);
        form.find(".reporte-fin").val(reporte.fecha_fin);
        form.find(".reporte-estado").val(reporte.estado);
        form.find(".btnGuardarReporte").text("Actualizar reporte");
        window.scrollTo({ top: form.offset().top - 120, behavior: "smooth" });
    });

    $(document).on("click", ".btnEliminarReporte", function () {
        const id = Number($(this).data("id"));

        if (!confirm("¿Desea eliminar este reporte del historial?")) {
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
                listarReportes();
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "danger");
            }
        });
    });

    $(".btnExportarReporte").on("click", function () {
        exportarCsv($(this).data("tipo"));
    });

    $(".btnImprimirReporte").on("click", function () {
        imprimirReporte($(this).data("tipo"));
    });

    function listarReportes() {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            success: function (respuesta) {
                reportes = respuesta.data || [];
                ["Prestamos", "Devoluciones", "Multas"].forEach(renderizarTipo);
                $("#totalReportes").text(reportes.length);
            },
            error: function (xhr) {
                mostrarAlerta(obtenerMensajeError(xhr), "danger");
            }
        });
    }

    function renderizarTipo(tipo) {
        const lista = reportes.filter(function (item) {
            return item.tipo_reporte === tipo;
        });
        const tbody = $(`.tablaReportes[data-tipo="${tipo}"]`);

        if (!lista.length) {
            tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">No hay reportes generados.</td></tr>');
            return;
        }

        tbody.html(lista.map(function (reporte) {
            const badge = reporte.estado === "Generado" ? "text-bg-success" : "text-bg-secondary";
            return `
                <tr>
                    <td>${Number(reporte.id)}</td>
                    <td>${escapar(reporte.usuario)}</td>
                    <td>${escapar(reporte.fecha_inicio)}</td>
                    <td>${escapar(reporte.fecha_fin)}</td>
                    <td>${escapar(reporte.fecha_generacion)}</td>
                    <td><span class="badge ${badge}">${escapar(reporte.estado)}</span></td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary btnEditarReporte" data-id="${Number(reporte.id)}">Editar</button>
                        <button type="button" class="btn btn-sm btn-outline-danger btnEliminarReporte" data-id="${Number(reporte.id)}">Eliminar</button>
                    </td>
                </tr>`;
        }).join(""));
    }

    function exportarCsv(tipo) {
        const lista = reportes.filter(function (item) {
            return item.tipo_reporte === tipo;
        });

        if (!lista.length) {
            mostrarAlerta("No hay datos para exportar.", "warning");
            return;
        }

        const filas = [["ID", "Usuario", "Tipo", "Fecha inicio", "Fecha fin", "Generado", "Estado"]];
        lista.forEach(function (item) {
            filas.push([item.id, item.usuario, item.tipo_reporte, item.fecha_inicio, item.fecha_fin, item.fecha_generacion, item.estado]);
        });

        const csv = filas.map(function (fila) {
            return fila.map(function (valor) {
                return '"' + String(valor == null ? "" : valor).replace(/"/g, '""') + '"';
            }).join(",");
        }).join("\r\n");

        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
        enlace.download = "reporte-" + tipo.toLowerCase() + ".csv";
        enlace.click();
        URL.revokeObjectURL(enlace.href);
    }

    function imprimirReporte(tipo) {
        const lista = reportes.filter(function (item) {
            return item.tipo_reporte === tipo;
        });

        if (!lista.length) {
            mostrarAlerta("No hay datos para imprimir.", "warning");
            return;
        }

        const filas = lista.map(function (item) {
            return `<tr><td>${Number(item.id)}</td><td>${escapar(item.usuario)}</td><td>${escapar(item.fecha_inicio)}</td><td>${escapar(item.fecha_fin)}</td><td>${escapar(item.estado)}</td></tr>`;
        }).join("");
        const ventana = window.open("", "_blank", "width=900,height=650");

        if (!ventana) {
            mostrarAlerta("El navegador bloqueó la ventana de impresión.", "warning");
            return;
        }

        ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de ${tipo}</title><style>body{font-family:Arial;padding:28px;color:#0A3323}table{width:100%;border-collapse:collapse}th,td{border:1px solid #839958;padding:9px;text-align:left}th{background:#0A3323;color:white}</style></head><body><h1>Reporte de ${tipo}</h1><table><thead><tr><th>ID</th><th>Usuario</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table></body></html>`);
        ventana.document.close();
        ventana.focus();
        ventana.print();
    }

    function establecerFechasIniciales() {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const formato = function (fecha) {
            return fecha.toISOString().slice(0, 10);
        };

        $(".reporte-inicio").val(formato(inicio));
        $(".reporte-fin").val(formato(hoy));
    }

    function limpiarFormulario(form) {
        form[0].reset();
        form.find(".reporte-id").val("");
        form.find(".btnGuardarReporte").text("Generar reporte");
        establecerFechasIniciales();
    }

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaReportes").html(`<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">${escapar(mensaje)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button></div>`);
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
