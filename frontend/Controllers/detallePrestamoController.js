const API_PRESTAMOS = "../../backend/api/prestamos.php";

$(document).ready(function () {
  cargarDetallePrestamo();

  /* ===================== AUXILIARES ===================== */

  function obtenerParametroUrl(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
  }

  function formatearFecha(fecha) {
    if (!fecha) return "";

    const texto = String(fecha);

    if (texto.includes("/")) {
      return texto;
    }

    const soloFecha = texto.split(" ")[0];

    if (!soloFecha.includes("-")) {
      return soloFecha;
    }

    const partes = soloFecha.split("-");

    if (partes.length !== 3) {
      return soloFecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function obtenerData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.prestamos)) return res.prestamos;
    if (res.data && typeof res.data === "object") return res.data;
    if (res.prestamo && typeof res.prestamo === "object") return res.prestamo;
    if (res && typeof res === "object") return res;
    return null;
  }

  function limpiarCampos() {
    $("#txtIdPrestamo").val("");
    $("#txtUsuarioPrestamo").val("");
    $("#txtIdUsuario").val("");
    $("#txtLibroPrestamo").val("");
    $("#txtIdLibro").val("");
    $("#txtFechaPrestamo").val("");
    $("#txtFechaDevolucion").val("");
    $("#txtEstadoPrestamo").val("");
  }

  function mostrarMensaje() {
    $("#mensajeDetalle").show();
    limpiarCampos();
  }

  function ocultarMensaje() {
    $("#mensajeDetalle").hide();
  }

  /* ===================== CARGAR DETALLE ===================== */

  function cargarDetallePrestamo() {
    const idUrl = obtenerParametroUrl("id");

    const detalleGuardado = sessionStorage.getItem("detallePrestamo");

    if (detalleGuardado) {
      try {
        const prestamo = JSON.parse(detalleGuardado);

        if (!idUrl || String(prestamo.id) === String(idUrl)) {
          pintarDetalle(prestamo);
          return;
        }
      } catch (error) {
        console.error("Error leyendo detallePrestamo:", error);
      }
    }

    if (idUrl) {
      consultarPrestamoPorId(idUrl);
      return;
    }

    mostrarMensaje();
  }

  function consultarPrestamoPorId(id) {
    $.ajax({
      url: API_PRESTAMOS,
      method: "GET",
      dataType: "json",
      data: {
        id: id,
      },
      success: function (res) {
        console.log("DETALLE PRÉSTAMO:", res);

        const data = obtenerData(res);

        if (!data) {
          mostrarMensaje();
          return;
        }

        if (Array.isArray(data)) {
          const prestamo = data.find(p => {
            return String(p.id_prestamo ?? p.id) === String(id);
          });

          if (!prestamo) {
            mostrarMensaje();
            return;
          }

          pintarDetalle({
            id: prestamo.id_prestamo ?? prestamo.id ?? "",
            id_usuario: prestamo.id_usuario ?? prestamo.usuario_id ?? "",
            usuario:
              prestamo.usuario ??
              prestamo.nombre_usuario ??
              prestamo.nombre ??
              "",
            id_libro: prestamo.id_libro ?? prestamo.libro_id ?? "",
            libro:
              prestamo.libro ??
              prestamo.titulo ??
              prestamo.titulo_libro ??
              prestamo.nombre_libro ??
              "",
            fecha_prestamo: prestamo.fecha_prestamo ?? "",
            fecha_devolucion: prestamo.fecha_devolucion ?? "",
            estado: prestamo.estado ?? "",
          });

          return;
        }

        pintarDetalle({
          id: data.id_prestamo ?? data.id ?? "",
          id_usuario: data.id_usuario ?? data.usuario_id ?? "",
          usuario: data.usuario ?? data.nombre_usuario ?? data.nombre ?? "",
          id_libro: data.id_libro ?? data.libro_id ?? "",
          libro:
            data.libro ??
            data.titulo ??
            data.titulo_libro ??
            data.nombre_libro ??
            "",
          fecha_prestamo: data.fecha_prestamo ?? "",
          fecha_devolucion: data.fecha_devolucion ?? "",
          estado: data.estado ?? "",
        });
      },
      error: function (xhr) {
        console.error("Error consultando detalle préstamo:", xhr.responseText);
        mostrarMensaje();
      },
    });
  }

  function pintarDetalle(prestamo) {
    if (!prestamo) {
      mostrarMensaje();
      return;
    }

    ocultarMensaje();

    $("#txtIdPrestamo").val(prestamo.id ?? "");
    $("#txtUsuarioPrestamo").val(prestamo.usuario ?? "");
    $("#txtIdUsuario").val(prestamo.id_usuario ?? "");
    $("#txtLibroPrestamo").val(prestamo.libro ?? "");
    $("#txtIdLibro").val(prestamo.id_libro ?? "");
    $("#txtFechaPrestamo").val(formatearFecha(prestamo.fecha_prestamo));
    $("#txtFechaDevolucion").val(formatearFecha(prestamo.fecha_devolucion));
    $("#txtEstadoPrestamo").val(prestamo.estado ?? "");
  }

  /* ===================== BOTONES ===================== */

  $("#btnVolver").click(function () {
    window.history.back();
  });

  $("#btnVerLibro").click(function () {
    const idLibro = $("#txtIdLibro").val();

    if (!idLibro) {
      alert("No se encontró el libro asociado a este préstamo.");
      return;
    }

    window.location.href = `detalleLibro.html?id=${encodeURIComponent(idLibro)}`;
  });
});
