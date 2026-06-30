console.log("reservasController.js actualizado sin btn-editar v30");

const API_URL = "../../backend/api/reservas.php";
const API_USUARIOS = "../../backend/api/usuarios.php";
const API_LIBROS = "../../backend/api/libros.php";

let reservasGlobal = [];
let librosGlobal = [];
let modoActualizacion = false;

$(document).ready(function () {
  const DIAS_LIMITE = 3;

  inicializarFormulario();

  cargarUsuarios();

  cargarReservas(function () {
    cargarLibros();
    cargarEstadisticas();
  });

  function inicializarFormulario() {
    $("#txtEstadoLibro").prop("disabled", true);
    $("#txtEstadoReserva").prop("disabled", true);
    $("#txtPosicion").prop("readonly", true);

    $("#btnActualizar").prop("disabled", true);
    $("#btnRegistrarReserva").prop("disabled", false);

    modoActualizacion = false;
  }

  function activarModoActualizacion() {
    modoActualizacion = true;

    $("#btnActualizar").prop("disabled", false);
    $("#btnRegistrarReserva").prop("disabled", true);
  }

  function desactivarModoActualizacion() {
    modoActualizacion = false;

    $("#btnActualizar").prop("disabled", true);
    $("#btnRegistrarReserva").prop("disabled", false);
  }

  function normalizarTexto(texto) {
    return String(texto ?? "")
      .toLowerCase()
      .trim();
  }

  function obtenerFechaHoy() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, "0");
    const day = String(hoy.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function obtenerFechaLimite() {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + DIAS_LIMITE);

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function obtenerData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.reservas)) return res.reservas;
    return [];
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function obtenerIdLibro(libro) {
    return libro.id_libro ?? libro.id;
  }

  function obtenerTituloLibro(libro) {
    return libro.titulo ?? libro.nombre ?? libro.nombre_libro ?? "Sin título";
  }

  function obtenerEstadoLibro(libro) {
    return (
      libro.estado_libro ?? libro.estado ?? libro.disponibilidad ?? "Disponible"
    );
  }

  function obtenerIdReserva(reserva) {
    return reserva.id_reserva ?? reserva.id;
  }

  function obtenerIdLibroReserva(reserva) {
    return reserva.libro_id ?? reserva.id_libro;
  }

  function obtenerIdUsuarioReserva(reserva) {
    return reserva.usuario_id ?? reserva.id_usuario;
  }

  function obtenerReservaPorId(id) {
    return reservasGlobal.find(r => {
      return String(obtenerIdReserva(r)) === String(id);
    });
  }

  function esReservaVigente(reserva) {
    const estado = normalizarTexto(reserva.estado);

    return estado === "activo" || estado === "activa" || estado === "en espera";
  }

  function esReservaEditable(estado) {
    const estadoNormalizado = normalizarTexto(estado);

    return (
      estadoNormalizado === "activo" ||
      estadoNormalizado === "activa" ||
      estadoNormalizado === "en espera"
    );
  }

  function esReservaNoEditable(estado) {
    const estadoNormalizado = normalizarTexto(estado);

    return (
      estadoNormalizado === "cancelado" ||
      estadoNormalizado === "cancelada" ||
      estadoNormalizado === "finalizado" ||
      estadoNormalizado === "finalizada" ||
      estadoNormalizado === "inactivo" ||
      estadoNormalizado === "inactiva"
    );
  }

  function libroTieneReservaVigente(libroId) {
    return reservasGlobal.some(r => {
      const mismoLibro = String(obtenerIdLibroReserva(r)) === String(libroId);
      return mismoLibro && esReservaVigente(r);
    });
  }

  function obtenerEstadoRealLibro(libro) {
    const libroId = obtenerIdLibro(libro);
    const estadoBase = obtenerEstadoLibro(libro);
    const estadoBaseNormalizado = normalizarTexto(estadoBase);

    if (
      estadoBaseNormalizado === "disponible" &&
      libroTieneReservaVigente(libroId)
    ) {
      return "Reservado";
    }

    return estadoBase;
  }

  function buscarLibroSeleccionado() {
    const libroId = $("#txtLibro").val();

    return librosGlobal.find(l => {
      return String(obtenerIdLibro(l)) === String(libroId);
    });
  }

  function usuarioYaReservoLibro(usuarioId, libroId, idActual = "") {
    return reservasGlobal.some(r => {
      const idReserva = String(obtenerIdReserva(r));
      const mismoUsuario =
        String(obtenerIdUsuarioReserva(r)) === String(usuarioId);
      const mismoLibro = String(obtenerIdLibroReserva(r)) === String(libroId);

      if (idActual && idReserva === String(idActual)) {
        return false;
      }

      return mismoUsuario && mismoLibro && esReservaVigente(r);
    });
  }

  function limpiarFormulario() {
    $("#txtId").val("");
    $("#txtUsuario").val("");
    $("#txtLibro").val("");
    $("#txtEstadoLibro").val("");
    $("#txtFechaReserva").val("");
    $("#txtFechaLimite").val("");
    $("#txtPosicion").val("");
    $("#txtEstadoReserva").val("");
    $("#txtObservaciones").val("");

    desactivarModoActualizacion();
  }

  function prepararFechas() {
    if (!$("#txtFechaReserva").val()) {
      $("#txtFechaReserva").val(obtenerFechaHoy());
    }

    if (!$("#txtFechaLimite").val()) {
      $("#txtFechaLimite").val(obtenerFechaLimite());
    }
  }

  function aplicarLogicaPorBackend() {
    const libroId = $("#txtLibro").val();
    const idActual = $("#txtId").val();

    if (!libroId) {
      $("#txtEstadoLibro").val("");
      $("#txtEstadoReserva").val("");
      $("#txtPosicion").val("");
      $("#txtObservaciones").val("");

      if (!modoActualizacion) {
        $("#btnRegistrarReserva").prop("disabled", false);
      }

      return;
    }

    prepararFechas();

    $.ajax({
      url: API_URL,
      method: "GET",
      dataType: "json",
      data: {
        preview: 1,
        libro_id: libroId,
        id_actual: idActual || 0,
      },
      success: function (res) {
        console.log("PREVIEW RESERVA:", res);

        $("#txtEstadoLibro").val(res.estado_reserva ?? "");
        $("#txtEstadoReserva").val(res.estado ?? "");
        $("#txtPosicion").val(res.posicion ?? "");
        $("#txtObservaciones").val(res.observaciones ?? "");

        if (!modoActualizacion) {
          $("#btnRegistrarReserva").prop("disabled", false);
        }
      },
      error: function (xhr) {
        console.error("Error preview reserva:", xhr.responseText);

        let mensaje = "No se puede registrar reserva para este libro.";

        try {
          const res = JSON.parse(xhr.responseText);
          mensaje = res.message ?? mensaje;
        } catch (e) {}

        const libro = buscarLibroSeleccionado();
        const estadoLibro = libro ? obtenerEstadoRealLibro(libro) : "";

        $("#txtEstadoLibro").val(estadoLibro);
        $("#txtEstadoReserva").val("");
        $("#txtPosicion").val("");
        $("#txtObservaciones").val(mensaje);

        if (!modoActualizacion) {
          $("#btnRegistrarReserva").prop("disabled", true);
        }
      },
    });
  }

  function aplicarLogicaAlSeleccionarLibro() {
    const libro = buscarLibroSeleccionado();

    if (!libro) {
      $("#txtEstadoLibro").val("");
      $("#txtEstadoReserva").val("");
      $("#txtPosicion").val("");
      $("#txtObservaciones").val("");

      if (!modoActualizacion) {
        $("#btnRegistrarReserva").prop("disabled", false);
      }

      return;
    }

    prepararFechas();
    aplicarLogicaPorBackend();
  }

  function prepararDatosFormulario() {
    const id = $("#txtId").val();

    return {
      id: id,
      id_reserva: id,
      usuario_id: $("#txtUsuario").val(),
      libro_id: $("#txtLibro").val(),
      fecha_reserva: $("#txtFechaReserva").val() || obtenerFechaHoy(),
      fecha_limite: $("#txtFechaLimite").val() || obtenerFechaLimite(),
      observaciones: $("#txtObservaciones").val(),
    };
  }

  function pintarReservas(data) {
    let html = "";

    if (!data || data.length === 0) {
      html = `
        <tr>
          <td colspan="10" style="text-align:center;">
            No hay reservas registradas.
          </td>
        </tr>
      `;

      $("#tablaReservas").html(html);
      return;
    }

    data.forEach(r => {
      const id = obtenerIdReserva(r);
      const usuarioId = obtenerIdUsuarioReserva(r);
      const libroId = obtenerIdLibroReserva(r);

      const usuario =
        r.usuario ?? r.nombre_usuario ?? r.nombre ?? "Sin usuario";
      const libro = r.libro ?? r.titulo ?? r.nombre_libro ?? "Sin libro";
      const estadoLibro = r.estado_reserva ?? r.estado_libro ?? "";
      const posicionNumero = Number(r.posicion_lista_espera ?? 0);
      const posicion = posicionNumero > 0 ? posicionNumero : "";
      const fechaReserva = r.fecha_reserva ?? "";
      const fechaLimite = r.fecha_limite ?? "";
      const estado = r.estado ?? "";
      const observaciones = r.observaciones ?? "";

      const puedeGestionar = esReservaEditable(estado);
      const puedeActualizar = esReservaEditable(estado);

      const botonActualizar = puedeActualizar
        ? `
          <button type="button" class="btn btn-secondary btn-actualizar-fila"
            data-id="${escaparHtml(id)}"
            data-usuario="${escaparHtml(usuarioId)}"
            data-libro="${escaparHtml(libroId)}"
            data-estado-libro="${escaparHtml(estadoLibro)}"
            data-fecha="${escaparHtml(fechaReserva)}"
            data-limite="${escaparHtml(fechaLimite)}"
            data-posicion="${escaparHtml(posicion)}"
            data-estado="${escaparHtml(estado)}"
            data-observaciones="${escaparHtml(observaciones)}">
            Actualizar
          </button>
        `
        : `
          <button type="button" class="btn btn-secondary" disabled>
            No actualizar
          </button>
        `;

      const botonAsignar = puedeGestionar
        ? `
          <button type="button" class="btn btn-primary btn-asignar"
            data-id="${escaparHtml(id)}"
            data-estado="${escaparHtml(estado)}">
            Asignar libro
          </button>
        `
        : `
          <button type="button" class="btn btn-secondary" disabled>
            No asignable
          </button>
        `;

      const botonCancelar = puedeGestionar
        ? `
          <button type="button" class="btn btn-danger btn-eliminar"
            data-id="${escaparHtml(id)}"
            data-estado="${escaparHtml(estado)}">
            Cancelar
          </button>
        `
        : `
          <button type="button" class="btn btn-secondary" disabled>
            No cancelar
          </button>
        `;

      html += `
        <tr>
          <td>${escaparHtml(id)}</td>
          <td>${escaparHtml(usuario)}</td>
          <td>${escaparHtml(libro)}</td>
          <td>${escaparHtml(estadoLibro)}</td>
          <td>${escaparHtml(posicion)}</td>
          <td>${escaparHtml(fechaReserva)}</td>
          <td>${escaparHtml(fechaLimite)}</td>
          <td>${escaparHtml(estado)}</td>
          <td>${escaparHtml(observaciones)}</td>
          <td>
            ${botonActualizar}
            ${botonAsignar}
            ${botonCancelar}
          </td>
        </tr>
      `;
    });

    $("#tablaReservas").html(html);
  }

  function cargarReservas(callback = null) {
    $.ajax({
      url: API_URL,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("RESERVAS:", res);

        reservasGlobal = obtenerData(res);
        pintarReservas(reservasGlobal);

        if (callback) callback();
      },
      error: function (xhr) {
        console.error("Error reservas:", xhr.responseText);

        $("#tablaReservas").html(`
          <tr>
            <td colspan="10" style="text-align:center;">
              Error al cargar las reservas.
            </td>
          </tr>
        `);
      },
    });
  }

  $("#formReserva").submit(function (e) {
    e.preventDefault();

    const data = prepararDatosFormulario();

    if (modoActualizacion || data.id) {
      alert(
        "Está actualizando una reserva existente. Use el botón Actualizar del formulario.",
      );
      return;
    }

    if (!data.usuario_id) {
      alert("Seleccione un usuario.");
      return;
    }

    if (!data.libro_id) {
      alert("Seleccione un libro.");
      return;
    }

    if ($("#btnRegistrarReserva").prop("disabled")) {
      alert("Este libro no permite reservación.");
      return;
    }

    if (usuarioYaReservoLibro(data.usuario_id, data.libro_id, data.id)) {
      alert(
        "Este usuario ya tiene una reserva activa o en espera para este mismo libro.",
      );
      return;
    }

    $.ajax({
      url: API_URL,
      method: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(data),
      success: function (res) {
        console.log("POST RESERVA:", res);

        if (res.success === false) {
          alert(res.message ?? "No se pudo registrar la reserva.");
          return;
        }

        if (res.estado === "En espera") {
          alert(
            `Reserva registrada. Posición en lista de espera: ${res.posicion}`,
          );
        } else if (res.estado === "Activo") {
          alert(
            `Reserva registrada correctamente. Posición en lista: ${res.posicion}`,
          );
        } else {
          alert(res.message ?? "Reserva registrada correctamente.");
        }

        $("#formReserva")[0].reset();
        limpiarFormulario();

        cargarReservas(function () {
          cargarLibros();
          cargarEstadisticas();
        });
      },
      error: function (xhr) {
        console.error("Error POST:", xhr.responseText);

        let mensaje = "Error al crear la reserva.";

        try {
          const res = JSON.parse(xhr.responseText);
          mensaje = res.message ?? mensaje;
        } catch (e) {}

        alert(mensaje);
      },
    });
  });

  $(document).on("click", ".btn-actualizar-fila", function (e) {
    e.preventDefault();

    const id = $(this).data("id");
    const reservaOriginal = obtenerReservaPorId(id);

    if (!reservaOriginal) {
      alert("No se encontró la reserva seleccionada.");
      limpiarFormulario();
      return;
    }

    if (esReservaNoEditable(reservaOriginal.estado)) {
      alert(
        "No se puede actualizar una reserva cancelada, finalizada o inactiva.",
      );
      limpiarFormulario();
      return;
    }

    if (!esReservaEditable(reservaOriginal.estado)) {
      alert("Esta reserva no se puede actualizar por su estado actual.");
      limpiarFormulario();
      return;
    }

    $("#txtId").val(obtenerIdReserva(reservaOriginal));
    $("#txtUsuario").val(String(obtenerIdUsuarioReserva(reservaOriginal)));
    $("#txtLibro").val(String(obtenerIdLibroReserva(reservaOriginal)));

    $("#txtEstadoLibro").val(
      reservaOriginal.estado_reserva ?? reservaOriginal.estado_libro ?? "",
    );
    $("#txtFechaReserva").val(reservaOriginal.fecha_reserva ?? "");
    $("#txtFechaLimite").val(reservaOriginal.fecha_limite ?? "");
    $("#txtPosicion").val(reservaOriginal.posicion_lista_espera ?? "");
    $("#txtEstadoReserva").val(reservaOriginal.estado ?? "");
    $("#txtObservaciones").val(reservaOriginal.observaciones ?? "");

    activarModoActualizacion();

    window.scrollTo({
      top: $("#formReserva").offset().top - 120,
      behavior: "smooth",
    });
  });

  $("#btnActualizar").on("click", function (e) {
    e.preventDefault();

    if ($("#btnActualizar").prop("disabled")) {
      return;
    }

    const id = $("#txtId").val();

    if (!id) {
      alert("Seleccione una reserva para actualizar.");
      limpiarFormulario();
      return;
    }

    const reservaOriginal = obtenerReservaPorId(id);

    if (!reservaOriginal) {
      alert("No se encontró la reserva seleccionada.");
      limpiarFormulario();
      return;
    }

    if (esReservaNoEditable(reservaOriginal.estado)) {
      alert(
        "No se puede actualizar una reserva cancelada, finalizada o inactiva.",
      );
      limpiarFormulario();
      return;
    }

    if (!esReservaEditable(reservaOriginal.estado)) {
      alert("Esta reserva no se puede actualizar por su estado actual.");
      limpiarFormulario();
      return;
    }

    const data = prepararDatosFormulario();

    data.estado = reservaOriginal.estado;
    data.estado_reserva = reservaOriginal.estado_reserva;
    data.posicion_lista_espera = reservaOriginal.posicion_lista_espera;

    if (!data.usuario_id) {
      alert("Seleccione un usuario.");
      return;
    }

    if (!data.libro_id) {
      alert("Seleccione un libro.");
      return;
    }

    if (usuarioYaReservoLibro(data.usuario_id, data.libro_id, data.id)) {
      alert(
        "Este usuario ya tiene otra reserva activa o en espera para este mismo libro.",
      );
      return;
    }

    $.ajax({
      url: API_URL,
      method: "PUT",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(data),
      success: function (res) {
        console.log("PUT RESERVA:", res);

        if (res.success === false) {
          alert(res.message ?? "No se pudo actualizar la reserva.");
          return;
        }

        alert("Reserva actualizada correctamente.");

        $("#formReserva")[0].reset();
        limpiarFormulario();

        cargarReservas(function () {
          cargarLibros();
          cargarEstadisticas();
        });
      },
      error: function (xhr) {
        console.error("Error PUT:", xhr.responseText);

        let mensaje = "Error al actualizar la reserva.";

        try {
          const res = JSON.parse(xhr.responseText);
          mensaje = res.message ?? mensaje;
        } catch (e) {}

        alert(mensaje);
      },
    });
  });

  $(document).on("click", ".btn-asignar", function (e) {
    e.preventDefault();

    const id = $(this).data("id");
    const estado = normalizarTexto($(this).data("estado"));

    if (!id) {
      alert("No se encontró la reserva seleccionada.");
      return;
    }

    if (estado !== "activo" && estado !== "activa" && estado !== "en espera") {
      alert(
        "No se puede asignar este libro porque la reserva ya está finalizada, cancelada o inactiva.",
      );
      return;
    }

    if (
      !confirm(
        "¿Deseas asignar este libro al usuario, generar el préstamo y finalizar la reserva?",
      )
    ) {
      return;
    }

    $.ajax({
      url: API_URL,
      method: "PUT",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        id: id,
        accion: "asignar_libro",
      }),
      success: function (res) {
        console.log("ASIGNAR LIBRO:", res);

        if (res.success === false) {
          alert(res.message ?? "No se pudo asignar el libro.");
          return;
        }

        alert(
          "Libro asignado correctamente. Se generó el préstamo y la cola fue actualizada.",
        );

        $("#formReserva")[0].reset();
        limpiarFormulario();

        cargarReservas(function () {
          cargarLibros();
          cargarEstadisticas();
        });
      },
      error: function (xhr) {
        console.error("Error asignando libro:", xhr.responseText);

        let mensaje = "Error al asignar el libro.";

        try {
          const res = JSON.parse(xhr.responseText);
          mensaje = res.message ?? mensaje;
        } catch (e) {}

        alert(mensaje);
      },
    });
  });

  function cancelarReserva(id) {
    $.ajax({
      url: API_URL + "?id=" + id,
      method: "DELETE",
      dataType: "json",
      success: function (res) {
        console.log("DELETE RESERVA:", res);

        if (res.success === false) {
          alert(res.message ?? "No se pudo cancelar la reserva.");
          return;
        }

        alert("Reserva cancelada. La cola fue actualizada.");

        $("#formReserva")[0].reset();
        limpiarFormulario();

        cargarReservas(function () {
          cargarLibros();
          cargarEstadisticas();
        });
      },
      error: function (xhr) {
        console.error("Error DELETE:", xhr.responseText);

        let mensaje = "Error al cancelar la reserva.";

        try {
          const res = JSON.parse(xhr.responseText);
          mensaje = res.message ?? mensaje;
        } catch (e) {}

        alert(mensaje);
      },
    });
  }

  $(document).on("click", ".btn-eliminar", function (e) {
    e.preventDefault();

    const id = $(this).data("id");
    const estado = normalizarTexto($(this).data("estado"));

    if (estado !== "activo" && estado !== "activa" && estado !== "en espera") {
      alert(
        "No se puede cancelar una reserva finalizada, cancelada o inactiva.",
      );
      return;
    }

    if (!confirm("¿Deseas cancelar esta reserva?")) return;

    cancelarReserva(id);
  });

  $("#btnCancelarReserva").on("click", function (e) {
    e.preventDefault();

    const id = $("#txtId").val();

    if (!id) {
      alert("Seleccione una reserva para cancelar.");
      return;
    }

    const reservaOriginal = obtenerReservaPorId(id);

    if (!reservaOriginal) {
      alert("No se encontró la reserva seleccionada.");
      limpiarFormulario();
      return;
    }

    const estado = normalizarTexto(reservaOriginal.estado);

    if (estado !== "activo" && estado !== "activa" && estado !== "en espera") {
      alert(
        "No se puede cancelar una reserva finalizada, cancelada o inactiva.",
      );
      limpiarFormulario();
      return;
    }

    if (!confirm("¿Deseas cancelar esta reserva?")) return;

    cancelarReserva(id);
  });

  $("#txtBuscar").on("keyup", function () {
    const texto = normalizarTexto($(this).val());

    if (!texto) {
      pintarReservas(reservasGlobal);
      return;
    }

    const filtradas = reservasGlobal.filter(r => {
      return (
        normalizarTexto(r.usuario).includes(texto) ||
        normalizarTexto(r.nombre_usuario).includes(texto) ||
        normalizarTexto(r.libro).includes(texto) ||
        normalizarTexto(r.titulo).includes(texto) ||
        normalizarTexto(r.estado).includes(texto) ||
        normalizarTexto(r.estado_reserva).includes(texto) ||
        normalizarTexto(r.observaciones).includes(texto)
      );
    });

    pintarReservas(filtradas);
  });

  $("#txtLibro").on("change", function () {
    cargarReservas(function () {
      aplicarLogicaAlSeleccionarLibro();
    });
  });

  $("#txtEstadoLibro").on("change", function () {
    if (!modoActualizacion) {
      aplicarLogicaPorBackend();
    }
  });

  $("#txtEstadoReserva").on("change", function () {
    if (!modoActualizacion) {
      aplicarLogicaPorBackend();
    }
  });

  $("#formReserva").on("reset", function () {
    setTimeout(function () {
      limpiarFormulario();
    }, 100);
  });

  function cargarUsuarios() {
    $.ajax({
      url: API_USUARIOS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("USUARIOS:", res);

        const data = obtenerData(res);

        let html = "<option value=''>Seleccione usuario</option>";

        data.forEach(u => {
          const idUsuario = u.id_usuario ?? u.id;
          const nombreUsuario =
            u.nombre ?? u.nombre_usuario ?? u.usuario ?? "Sin nombre";

          html += `
            <option value="${escaparHtml(idUsuario)}">
              ${escaparHtml(nombreUsuario)}
            </option>
          `;
        });

        $("#txtUsuario").html(html);
      },
      error: function (xhr) {
        console.error("Error usuarios:", xhr.responseText);
      },
    });
  }

  function cargarLibros() {
    $.ajax({
      url: API_LIBROS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("LIBROS:", res);

        librosGlobal = obtenerData(res);

        let html = "<option value=''>Seleccione libro</option>";

        librosGlobal.forEach(l => {
          const idLibro = obtenerIdLibro(l);
          const tituloLibro = obtenerTituloLibro(l);
          const estadoReal = obtenerEstadoRealLibro(l);

          html += `
            <option value="${escaparHtml(idLibro)}">
              ${escaparHtml(tituloLibro)} - ${escaparHtml(estadoReal)}
            </option>
          `;
        });

        $("#txtLibro").html(html);
      },
      error: function (xhr) {
        console.error("Error libros:", xhr.responseText);
        alert("No se pudieron cargar los libros. Revise libros.php");
      },
    });
  }

  function cargarEstadisticas() {
    $.ajax({
      url: API_URL + "?stats=1",
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("STATS:", res);

        const data = res.data ?? res;

        $("#totalReservas").val(data.total ?? 0);
        $("#reservasActivas").val(data.activas ?? 0);
        $("#reservasEspera").val(data.espera ?? 0);
        $("#librosDisponibles").val(data.libros ?? 0);
      },
      error: function (xhr) {
        console.error("Error stats:", xhr.responseText);
      },
    });
  }
});
