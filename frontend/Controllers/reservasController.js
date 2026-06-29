const API_URL = "../../backend/api/reservas.php";
const API_USUARIOS = "../../backend/api/usuarios.php";
const API_LIBROS = "../../backend/api/libros.php";

let reservasGlobal = [];
let librosGlobal = [];

$(document).ready(function () {
  const DIAS_LIMITE = 3;

  cargarUsuarios();

  cargarReservas(function () {
    cargarLibros();
    cargarEstadisticas();
  });

  function normalizarTexto(texto) {
    return String(texto ?? "").toLowerCase().trim();
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
    return libro.estado_libro ?? libro.estado ?? libro.disponibilidad ?? "Disponible";
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

  function esReservaVigente(reserva) {
    const estado = normalizarTexto(reserva.estado);
    return estado === "activo" || estado === "activa" || estado === "en espera";
  }

  function libroTieneReservaActiva(libroId) {
    return reservasGlobal.some(r => {
      const mismoLibro = String(obtenerIdLibroReserva(r)) === String(libroId);
      const estado = normalizarTexto(r.estado);
      return mismoLibro && (estado === "activo" || estado === "activa");
    });
  }

  function obtenerEstadoRealLibro(libro) {
    const libroId = obtenerIdLibro(libro);
    const estadoBase = obtenerEstadoLibro(libro);
    const estadoBaseNormalizado = normalizarTexto(estadoBase);

    if (estadoBaseNormalizado === "disponible" && libroTieneReservaActiva(libroId)) {
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
      const mismoUsuario = String(obtenerIdUsuarioReserva(r)) === String(usuarioId);
      const mismoLibro = String(obtenerIdLibroReserva(r)) === String(libroId);

      if (idActual && idReserva === String(idActual)) {
        return false;
      }

      return mismoUsuario && mismoLibro && esReservaVigente(r);
    });
  }

  function obtenerSiguientePosicionBackend(libroId, callback) {
    $.ajax({
      url: API_URL,
      method: "GET",
      dataType: "json",
      data: {
        next_position: 1,
        libro_id: libroId,
      },
      success: function (res) {
        console.log("SIGUIENTE POSICIÓN:", res);

        if (res.success) {
          callback(Number(res.posicion));
        } else {
          callback(1);
        }
      },
      error: function (xhr) {
        console.error("Error obteniendo posición:", xhr.responseText);
        callback(1);
      },
    });
  }

  function configurarOpcionesEstadoLibro(estadoReal) {
    $("#txtEstadoLibro option").prop("disabled", false).prop("hidden", false);

    const estadoNormalizado = normalizarTexto(estadoReal);

    if (
      estadoNormalizado === "reservado" ||
      estadoNormalizado === "prestado" ||
      estadoNormalizado === "no disponible"
    ) {
      $("#txtEstadoLibro option[value='Disponible']")
        .prop("disabled", true)
        .prop("hidden", true);
    }
  }

  function limpiarFormulario() {
    $("#txtId").val("");
    $("#txtUsuario").val("");
    $("#txtLibro").val("");
    $("#txtEstadoLibro option").prop("disabled", false).prop("hidden", false);
    $("#txtEstadoLibro").val("");
    $("#txtFechaReserva").val("");
    $("#txtFechaLimite").val("");
    $("#txtPosicion").val("");
    $("#txtEstadoReserva").val("");
    $("#txtObservaciones").val("");
  }

  function aplicarLogicaPorEstado() {
    const libroId = $("#txtLibro").val();
    const estadoLibro = $("#txtEstadoLibro").val();
    const estadoNormalizado = normalizarTexto(estadoLibro);

    if (!libroId || !estadoLibro) {
      $("#txtEstadoReserva").val("");
      $("#txtPosicion").val("");
      $("#txtObservaciones").val("");
      return;
    }

    if (!$("#txtFechaReserva").val()) {
      $("#txtFechaReserva").val(obtenerFechaHoy());
    }

    if (!$("#txtFechaLimite").val()) {
      $("#txtFechaLimite").val(obtenerFechaLimite());
    }

    if (estadoNormalizado === "disponible") {
      $("#txtEstadoReserva").val("Activo");
      $("#txtPosicion").val("");
      $("#txtObservaciones").val("El libro está disponible, no requiere reservar.");
      return;
    }

    if (estadoNormalizado === "prestado" || estadoNormalizado === "reservado") {
      $("#txtEstadoReserva").val("En espera");

      obtenerSiguientePosicionBackend(libroId, function (posicion) {
        $("#txtPosicion").val(posicion);
        $("#txtObservaciones").val(
          `El libro está ${estadoLibro}. La reserva queda en lista de espera en la posición ${posicion}.`
        );
      });

      return;
    }

    if (estadoNormalizado === "no disponible") {
      $("#txtEstadoReserva").val("");
      $("#txtPosicion").val("");
      $("#txtObservaciones").val("El libro no está disponible para reservar.");
      return;
    }
  }

  function aplicarLogicaAlSeleccionarLibro() {
    const libro = buscarLibroSeleccionado();

    if (!libro) {
      $("#txtEstadoLibro").val("");
      $("#txtEstadoReserva").val("");
      $("#txtPosicion").val("");
      $("#txtObservaciones").val("");
      return;
    }

    const estadoReal = obtenerEstadoRealLibro(libro);

    configurarOpcionesEstadoLibro(estadoReal);

    $("#txtEstadoLibro").val(estadoReal);
    $("#txtFechaReserva").val(obtenerFechaHoy());
    $("#txtFechaLimite").val(obtenerFechaLimite());

    aplicarLogicaPorEstado();
  }

  function prepararDatosFormulario() {
    const id = $("#txtId").val();
    const usuarioId = $("#txtUsuario").val();
    const libroId = $("#txtLibro").val();
    const estadoLibro = $("#txtEstadoLibro").val();
    const estadoLibroNormalizado = normalizarTexto(estadoLibro);

    let estadoReserva = "";
    let posicion = 0;
    let observaciones = $("#txtObservaciones").val();

    if (estadoLibroNormalizado === "disponible") {
      estadoReserva = "Activo";
      posicion = 0;

      if (!observaciones.trim()) {
        observaciones = "El libro está disponible, no requiere reservar.";
      }
    } else if (estadoLibroNormalizado === "prestado" || estadoLibroNormalizado === "reservado") {
      estadoReserva = "En espera";
      posicion = Number($("#txtPosicion").val() || 0);

      if (!observaciones.trim()) {
        observaciones = `El libro está ${estadoLibro}. La reserva queda en lista de espera en la posición ${posicion}.`;
      }
    } else if (estadoLibroNormalizado === "no disponible") {
      estadoReserva = "";
      posicion = 0;

      if (!observaciones.trim()) {
        observaciones = "El libro no está disponible para reservar.";
      }
    }

    const estadoSeleccionado = $("#txtEstadoReserva").val();

    if (estadoSeleccionado === "Cancelado" || estadoSeleccionado === "Finalizado") {
      estadoReserva = estadoSeleccionado;
      posicion = 0;
    }

    return {
      id: id,
      id_reserva: id,
      usuario_id: usuarioId,
      libro_id: libroId,
      estado_reserva: estadoLibro,
      fecha_reserva: $("#txtFechaReserva").val() || obtenerFechaHoy(),
      fecha_limite: $("#txtFechaLimite").val() || obtenerFechaLimite(),
      posicion_lista_espera: posicion,
      estado: estadoReserva,
      observaciones: observaciones,
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

      const usuario = r.usuario ?? r.nombre_usuario ?? r.nombre ?? "Sin usuario";
      const libro = r.libro ?? r.titulo ?? r.nombre_libro ?? "Sin libro";
      const estadoLibro = r.estado_reserva ?? r.estado_libro ?? "";
      const posicionNumero = Number(r.posicion_lista_espera ?? 0);
      const posicion = posicionNumero > 0 ? posicionNumero : "";
      const fechaReserva = r.fecha_reserva ?? "";
      const fechaLimite = r.fecha_limite ?? "";
      const estado = r.estado ?? "";
      const observaciones = r.observaciones ?? "";

      const estadoNormalizado = normalizarTexto(estado);
      const puedeGestionar = estadoNormalizado === "activo" || estadoNormalizado === "en espera";

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
            <button type="button" class="btn btn-secondary btn-editar"
              data-id="${escaparHtml(id)}"
              data-usuario="${escaparHtml(usuarioId)}"
              data-libro="${escaparHtml(libroId)}"
              data-estado-libro="${escaparHtml(estadoLibro)}"
              data-fecha="${escaparHtml(fechaReserva)}"
              data-limite="${escaparHtml(fechaLimite)}"
              data-posicion="${escaparHtml(posicion)}"
              data-estado="${escaparHtml(estado)}"
              data-observaciones="${escaparHtml(observaciones)}">
              Editar
            </button>

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

    if (data.id) {
      alert("Está editando una reserva existente. Use el botón Actualizar.");
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

    if (!data.estado_reserva) {
      alert("Seleccione el estado del libro.");
      return;
    }

    if (normalizarTexto(data.estado_reserva) === "no disponible") {
      alert("El libro está no disponible, por lo tanto no se puede registrar reserva.");
      return;
    }

    if (usuarioYaReservoLibro(data.usuario_id, data.libro_id, data.id)) {
      alert("Este usuario ya tiene una reserva activa o en espera para este mismo libro.");
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
          alert(`Reserva registrada. Posición en lista de espera: ${res.posicion}`);
        } else if (res.estado === "Activo") {
          alert("Reserva registrada correctamente como activa.");
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

  $(document).on("click", ".btn-editar", function (e) {
    e.preventDefault();

    $("#txtId").val($(this).data("id"));
    $("#txtUsuario").val(String($(this).data("usuario")));
    $("#txtLibro").val(String($(this).data("libro")));

    $("#txtEstadoLibro option").prop("disabled", false).prop("hidden", false);
    $("#txtEstadoLibro").val($(this).data("estado-libro"));

    $("#txtFechaReserva").val($(this).data("fecha"));
    $("#txtFechaLimite").val($(this).data("limite"));
    $("#txtPosicion").val($(this).data("posicion"));
    $("#txtEstadoReserva").val($(this).data("estado"));
    $("#txtObservaciones").val($(this).data("observaciones"));
  });

  $("#btnActualizar").click(function (e) {
    e.preventDefault();

    const id = $("#txtId").val();

    if (!id) {
      alert("Seleccione una reserva para actualizar.");
      return;
    }

    const data = prepararDatosFormulario();

    if (!data.usuario_id) {
      alert("Seleccione un usuario.");
      return;
    }

    if (!data.libro_id) {
      alert("Seleccione un libro.");
      return;
    }

    if (!data.estado_reserva) {
      alert("Seleccione el estado del libro.");
      return;
    }

    if (normalizarTexto(data.estado_reserva) === "no disponible") {
      alert("No se puede actualizar una reserva con libro no disponible.");
      return;
    }

    if (usuarioYaReservoLibro(data.usuario_id, data.libro_id, data.id)) {
      alert("Este usuario ya tiene otra reserva activa o en espera para este mismo libro.");
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

    if (estado !== "activo" && estado !== "en espera") {
      alert("No se puede asignar este libro porque la reserva ya está finalizada, cancelada o inactiva.");
      return;
    }

    if (!confirm("¿Deseas asignar este libro al usuario y finalizar la reserva?")) {
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

        alert("Libro asignado correctamente. La reserva fue finalizada y la cola actualizada.");

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
        alert("Error al cancelar la reserva.");
      },
    });
  }

  $(document).on("click", ".btn-eliminar", function (e) {
    e.preventDefault();

    const id = $(this).data("id");
    const estado = normalizarTexto($(this).data("estado"));

    if (estado !== "activo" && estado !== "en espera") {
      alert("No se puede cancelar una reserva finalizada, cancelada o inactiva.");
      return;
    }

    if (!confirm("¿Deseas cancelar esta reserva?")) return;

    cancelarReserva(id);
  });

  $("#btnCancelarReserva").click(function (e) {
    e.preventDefault();

    const id = $("#txtId").val();
    const estado = normalizarTexto($("#txtEstadoReserva").val());

    if (!id) {
      alert("Seleccione una reserva para cancelar.");
      return;
    }

    if (estado !== "activo" && estado !== "en espera") {
      alert("No se puede cancelar una reserva finalizada, cancelada o inactiva.");
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
    aplicarLogicaPorEstado();
  });

  $("#txtEstadoReserva").on("change", function () {
    const estadoReserva = $("#txtEstadoReserva").val();

    if (estadoReserva === "Cancelado" || estadoReserva === "Finalizado") {
      $("#txtPosicion").val("");
      return;
    }

    aplicarLogicaPorEstado();
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
          const nombreUsuario = u.nombre ?? u.nombre_usuario ?? u.usuario ?? "Sin nombre";

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