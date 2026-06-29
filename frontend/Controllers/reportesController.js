$(document).ready(function () {
    const API = "../../backend/api/reportes.php";
    const datosPorTipo = {
        Prestamos: [],
        Devoluciones: [],
        Multas: []
    };

    establecerFechasIniciales();

    $(".formReporte").on("submit", function (event) {
        event.preventDefault();

        const form = $(this);
        const tipo = form.data("tipo");
        const fechaInicio = form.find(".reporte-inicio").val();
        const fechaFin = form.find(".reporte-fin").val();
        const filtro = form.find(".reporte-filtro").val() || "";

        if (!fechaInicio || !fechaFin) {
            mostrarAlerta("Seleccione el rango de fechas del reporte.", "danger");
            return;
        }

        if (fechaInicio > fechaFin) {
            mostrarAlerta("La fecha inicial no puede ser posterior a la fecha final.", "danger");
            return;
        }

        form.find(".btnGuardarReporte").prop("disabled", true).text("Generando...");

        registrarGeneracion(tipo, fechaInicio, fechaFin)
            .always(function () {
                cargarDatos(tipo, fechaInicio, fechaFin, filtro, form);
            });
    });

    $(".btnExportarReporte").on("click", function () {
        exportarExcel($(this).data("tipo"));
    });

    $(".btnImprimirReporte").on("click", function () {
        imprimirReporte($(this).data("tipo"));
    });

    function registrarGeneracion(tipo, fechaInicio, fechaFin) {
        return $.ajax({
            url: API,
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                id_usuario: null,
                tipo_reporte: tipo,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                estado: "Generado"
            })
        });
    }

    function cargarDatos(tipo, fechaInicio, fechaFin, filtro, form) {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            data: {
                accion: "datos",
                tipo,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                filtro
            },
            success: function (respuesta) {
                datosPorTipo[tipo] = respuesta.data || [];
                renderizarDatos(tipo);
                actualizarTotal();
                cargarResumen(fechaInicio, fechaFin);
                mostrarAlerta(`${respuesta.message} Se encontraron ${datosPorTipo[tipo].length} registros.`, "success");
            },
            error: function (xhr) {
                datosPorTipo[tipo] = [];
                renderizarDatos(tipo);
                mostrarAlerta(obtenerMensajeError(xhr), "danger");
            },
            complete: function () {
                form.find(".btnGuardarReporte").prop("disabled", false).text("Generar reporte");
            }
        });
    }

    function renderizarDatos(tipo) {
        const lista = datosPorTipo[tipo];
        const tbody = $(`.tablaReportes[data-tipo="${tipo}"]`);
        const columnas = tipo === "Prestamos" ? 6 : (tipo === "Devoluciones" ? 7 : 7);

        if (!lista.length) {
            tbody.html(`<tr><td colspan="${columnas}" class="text-center text-muted py-4">No hay datos para el rango seleccionado.</td></tr>`);
            return;
        }

        if (tipo === "Prestamos") {
            tbody.html(lista.map(function (item) {
                return `<tr>
                    <td>${Number(item.id)}</td>
                    <td>${escapar(item.usuario)}</td>
                    <td>${escapar(item.libro)}</td>
                    <td>${formatearFecha(item.fecha_prestamo)}</td>
                    <td>${formatearFecha(item.fecha_devolucion)}</td>
                    <td><span class="badge ${claseEstadoPrestamo(item.estado)}">${escapar(item.estado)}</span></td>
                </tr>`;
            }).join(""));
            return;
        }

        if (tipo === "Devoluciones") {
            tbody.html(lista.map(function (item) {
                return `<tr>
                    <td>${Number(item.id)}</td>
                    <td>${escapar(item.usuario)}</td>
                    <td>${escapar(item.libro)}</td>
                    <td>${formatearFecha(item.fecha_limite)}</td>
                    <td>${formatearFecha(item.fecha_devuelto)}</td>
                    <td>${Number(item.dias_atraso)}</td>
                    <td>${escapar(item.observaciones || "Sin observaciones")}</td>
                </tr>`;
            }).join(""));
            return;
        }

        tbody.html(lista.map(function (item) {
            return `<tr>
                <td>${Number(item.id)}</td>
                <td>${escapar(item.usuario)}</td>
                <td>${escapar(item.libro)}</td>
                <td>${formatearFecha(item.fecha_devolucion)}</td>
                <td>${escapar(item.tipo)}</td>
                <td>${Number(item.dias_gracia)}</td>
                <td>₡${Number(item.monto || 0).toLocaleString("es-CR")}</td>
            </tr>`;
        }).join(""));
    }

    function exportarExcel(tipo) {
        const lista = datosPorTipo[tipo];

        if (!lista.length) {
            mostrarAlerta("Primero genere un reporte con datos para exportar.", "warning");
            return;
        }

        const configuracion = obtenerConfiguracion(tipo);
        const encabezados = configuracion.encabezados.map(function (valor) {
            return `<th>${escapar(valor)}</th>`;
        }).join("");
        const filas = lista.map(function (item) {
            return `<tr>${configuracion.valores(item).map(function (valor) {
                return `<td>${escapar(valor)}</td>`;
            }).join("")}</tr>`;
        }).join("");
        const contenido = `<!doctype html><html><head><meta charset="UTF-8"></head><body><table><thead><tr>${encabezados}</tr></thead><tbody>${filas}</tbody></table></body></html>`;
        const url = URL.createObjectURL(new Blob([contenido], { type: "application/vnd.ms-excel;charset=utf-8" }));
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `reporte-${tipo.toLowerCase()}.xls`;
        enlace.click();
        URL.revokeObjectURL(url);
    }

    function cargarResumen(fechaInicio, fechaFin) {
        $.ajax({
            url: API,
            method: "GET",
            dataType: "json",
            data: {
                accion: "resumen",
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            },
            success: function (respuesta) {
                const resumen = respuesta.data || {};
                const totales = resumen.totales || {};
                $("#resumenPrestamos").text(totales.prestamos || 0);
                $("#resumenDevoluciones").text(totales.devoluciones || 0);
                $("#resumenMultas").text(totales.multas || 0);
                renderizarRanking("#librosMasPrestados", resumen.libros_mas_prestados || []);
                renderizarRanking("#usuariosMasActivos", resumen.usuarios_mas_activos || []);
                $("#resumenReportes").prop("hidden", false);
            }
        });
    }

    function renderizarRanking(selector, elementos) {
        if (!elementos.length) {
            $(selector).html('<li class="list-group-item text-muted">Sin datos en este período</li>');
            return;
        }

        $(selector).html(elementos.map(function (item, indice) {
            return `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${indice + 1}. ${escapar(item.nombre)}</span><span class="badge text-bg-primary rounded-pill">${Number(item.total)}</span></li>`;
        }).join(""));
    }

    function imprimirReporte(tipo) {
        const lista = datosPorTipo[tipo];

        if (!lista.length) {
            mostrarAlerta("Primero genere un reporte con datos para imprimir.", "warning");
            return;
        }

        const configuracion = obtenerConfiguracion(tipo);
        const encabezados = configuracion.encabezados.map(function (item) {
            return `<th>${escapar(item)}</th>`;
        }).join("");
        const filas = lista.map(function (item) {
            return `<tr>${configuracion.valores(item).map(function (valor) {
                return `<td>${escapar(valor)}</td>`;
            }).join("")}</tr>`;
        }).join("");
        const ventana = window.open("", "_blank", "width=1000,height=700");

        if (!ventana) {
            mostrarAlerta("El navegador bloqueó la ventana de impresión.", "warning");
            return;
        }

        ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de ${tipo}</title><style>body{font-family:Arial;padding:28px;color:#0A3323}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #839958;padding:8px;text-align:left}th{background:#0A3323;color:white}</style></head><body><h1>Reporte de ${tipo}</h1><table><thead><tr>${encabezados}</tr></thead><tbody>${filas}</tbody></table></body></html>`);
        ventana.document.close();
        ventana.focus();
        ventana.print();
    }

    function obtenerConfiguracion(tipo) {
        if (tipo === "Prestamos") {
            return {
                encabezados: ["ID", "Usuario", "Libro", "Fecha préstamo", "Fecha devolución", "Estado"],
                valores: item => [item.id, item.usuario, item.libro, item.fecha_prestamo, item.fecha_devolucion, item.estado]
            };
        }

        if (tipo === "Devoluciones") {
            return {
                encabezados: ["ID", "Usuario", "Libro", "Fecha límite", "Fecha devuelta", "Días atraso", "Observaciones"],
                valores: item => [item.id, item.usuario, item.libro, item.fecha_limite, item.fecha_devuelto, item.dias_atraso, item.observaciones || ""]
            };
        }

        return {
            encabezados: ["ID", "Usuario", "Libro", "Fecha", "Tipo", "Días gracia", "Monto"],
            valores: item => [item.id, item.usuario, item.libro, item.fecha_devolucion, item.tipo, item.dias_gracia, item.monto]
        };
    }

    function establecerFechasIniciales() {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        $(".reporte-inicio").val(formatearFechaInput(inicio));
        $(".reporte-fin").val(formatearFechaInput(hoy));
    }

    function actualizarTotal() {
        const total = Object.values(datosPorTipo).reduce(function (acumulado, lista) {
            return acumulado + lista.length;
        }, 0);
        $("#totalReportes").text(total);
    }

    function formatearFechaInput(fecha) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, "0");
        const day = String(fecha.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function formatearFecha(valor) {
        return escapar(String(valor || "").replace("T", " ").slice(0, 16));
    }

    function claseEstadoPrestamo(estado) {
        if (estado === "Devuelto") return "text-bg-success";
        if (estado === "Perdido") return "text-bg-danger";
        return "text-bg-primary";
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
