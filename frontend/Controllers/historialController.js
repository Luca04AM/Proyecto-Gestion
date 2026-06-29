const API_PRESTAMOS = "../../backend/api/prestamos.php";
const API_MULTAS = "../../backend/api/multas.php";
const API_USUARIOS = "../../backend/api/usuarios.php";
const API_LIBROS = "../../backend/api/libros.php";

let prestamosGlobal = [];
let multasGlobal = [];
let usuariosGlobal = [];
let librosGlobal = [];

$(document).ready(function () {
  cargarDatosIniciales();

  /* ===================== CARGA INICIAL ===================== */

  function cargarDatosIniciales() {
    $.when(cargarUsuarios(), cargarLibros()).always(function () {
      cargarPrestamos();
      cargarMultas();
    });
  }

  /* ===================== AUXILIARES ===================== */

  function normalizarTexto(texto) {
    return String(texto ?? "")
      .toLowerCase()
      .trim();
  }

  function obtenerData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.prestamos)) return res.prestamos;
    if (Array.isArray(res.multas)) return res.multas;
    if (Array.isArray(res.usuarios)) return res.usuarios;
    if (Array.isArray(res.libros)) return res.libros;
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

  function fechaComparable(fecha) {
    if (!fecha) return "";

    const texto = String(fecha).split(" ")[0];

    if (texto.includes("-")) {
      return texto;
    }

    if (texto.includes("/")) {
      const partes = texto.split("/");

      if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }

    return "";
  }

  function formatearMonto(monto) {
    const numero = Number(monto ?? 0);
    return "₡" + numero.toLocaleString("es-CR");
  }

  function obtenerClaseBadge(valor) {
    const valorNormalizado = normalizarTexto(valor);

    if (valorNormalizado === "devuelto") {
      return "badge badge-disponible";
    }

    if (valorNormalizado === "prestado") {
      return "badge badge-reservado";
    }

    if (valorNormalizado === "perdido") {
      return "badge badge-no-disponible";
    }

    if (valorNormalizado === "atraso") {
      return "badge badge-reservado";
    }

    if (valorNormalizado === "daño" || valorNormalizado === "perdida") {
      return "badge badge-no-disponible";
    }

    return "badge";
  }

  function obtenerIdUsuario(usuario) {
    return usuario.id_usuario ?? usuario.id ?? "";
  }

  function obtenerNombreUsuario(usuario) {
    return (
      usuario.nombre ??
      usuario.nombre_usuario ??
      usuario.usuario ??
      `Usuario ${obtenerIdUsuario(usuario)}`
    );
  }

  function obtenerIdLibro(libro) {
    return libro.id_libro ?? libro.id ?? "";
  }

  function obtenerTituloLibro(libro) {
    return (
      libro.titulo ??
      libro.nombre_libro ??
      libro.libro ??
      libro.nombre ??
      `Libro ${obtenerIdLibro(libro)}`
    );
  }

  function buscarNombreUsuarioPorId(idUsuario) {
    const usuario = usuariosGlobal.find(u => {
      return String(obtenerIdUsuario(u)) === String(idUsuario);
    });

    if (!usuario) {
      return idUsuario ? `Usuario ${idUsuario}` : "Sin usuario";
    }

    return obtenerNombreUsuario(usuario);
  }

  function buscarTituloLibroPorId(idLibro) {
    const libro = librosGlobal.find(l => {
      return String(obtenerIdLibro(l)) === String(idLibro);
    });

    if (!libro) {
      return idLibro ? `Libro ${idLibro}` : "Sin libro";
    }

    return obtenerTituloLibro(libro);
  }

  /* ===================== USUARIOS Y LIBROS ===================== */

  function cargarUsuarios() {
    return $.ajax({
      url: API_USUARIOS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("USUARIOS:", res);
        usuariosGlobal = obtenerData(res);
      },
      error: function (xhr) {
        console.error("Error usuarios:", xhr.responseText);
        usuariosGlobal = [];
      },
    });
  }

  function cargarLibros() {
    return $.ajax({
      url: API_LIBROS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("LIBROS:", res);
        librosGlobal = obtenerData(res);
      },
      error: function (xhr) {
        console.error("Error libros:", xhr.responseText);
        librosGlobal = [];
      },
    });
  }

  /* ===================== CAMPOS PRÉSTAMOS ===================== */

  function obtenerIdPrestamo(prestamo) {
    return prestamo.id_prestamo ?? prestamo.id ?? "";
  }

  function obtenerIdUsuarioPrestamo(prestamo) {
    return prestamo.id_usuario ?? prestamo.usuario_id ?? "";
  }

  function obtenerUsuarioPrestamo(prestamo) {
    return (
      prestamo.usuario ??
      prestamo.nombre_usuario ??
      prestamo.nombre ??
      buscarNombreUsuarioPorId(obtenerIdUsuarioPrestamo(prestamo))
    );
  }

  function obtenerIdLibroPrestamo(prestamo) {
    return prestamo.id_libro ?? prestamo.libro_id ?? "";
  }

  function obtenerLibroPrestamo(prestamo) {
    return (
      prestamo.libro ??
      prestamo.titulo ??
      prestamo.titulo_libro ??
      prestamo.nombre_libro ??
      buscarTituloLibroPorId(obtenerIdLibroPrestamo(prestamo))
    );
  }

  function obtenerFechaPrestamo(prestamo) {
    return prestamo.fecha_prestamo ?? "";
  }

  function obtenerFechaDevolucionPrestamo(prestamo) {
    return prestamo.fecha_devolucion ?? "";
  }

  function obtenerEstadoPrestamo(prestamo) {
    return prestamo.estado ?? "";
  }

  /* ===================== PRÉSTAMOS ===================== */

  function cargarPrestamos() {
    $.ajax({
      url: API_PRESTAMOS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("PRÉSTAMOS:", res);

        prestamosGlobal = obtenerData(res);
        pintarPrestamos(prestamosGlobal);
      },
      error: function (xhr) {
        console.error("Error préstamos:", xhr.responseText);

        $("#tablaPrestamos").html(`
          <tr>
            <td colspan="7" style="text-align:center;">
              Error al cargar los préstamos.
            </td>
          </tr>
        `);

        $("#mensajeSinPrestamos").hide();
        $("#mensajeSinRegistros").hide();
      },
    });
  }

  function pintarPrestamos(data) {
    let html = "";

    if (!data || data.length === 0) {
      $("#tablaPrestamos").html(`
        <tr>
          <td colspan="7" style="text-align:center;">
            No hay préstamos registrados.
          </td>
        </tr>
      `);

      $("#mensajeSinPrestamos").show();
      $("#mensajeSinRegistros").show();
      return;
    }

    $("#mensajeSinPrestamos").hide();
    $("#mensajeSinRegistros").hide();

    data.forEach(prestamo => {
      const id = obtenerIdPrestamo(prestamo);
      const idLibro = obtenerIdLibroPrestamo(prestamo);
      const usuario = obtenerUsuarioPrestamo(prestamo);
      const libro = obtenerLibroPrestamo(prestamo);
      const fechaPrestamo = obtenerFechaPrestamo(prestamo);
      const fechaDevolucion = obtenerFechaDevolucionPrestamo(prestamo);
      const estado = obtenerEstadoPrestamo(prestamo);
      const claseBadge = obtenerClaseBadge(estado);

      html += `
        <tr>
          <td>${escaparHtml(id)}</td>
          <td>${escaparHtml(usuario)}</td>
          <td>${escaparHtml(libro)}</td>
          <td>${escaparHtml(formatearFecha(fechaPrestamo))}</td>
          <td>${escaparHtml(formatearFecha(fechaDevolucion))}</td>
          <td>
            <span class="${escaparHtml(claseBadge)}">
              ${escaparHtml(estado)}
            </span>
          </td>
          <td>
            <div class="acciones-tabla">
              <button type="button"
                class="btn btn-secondary btn-detalle-prestamo"
                data-id="${escaparHtml(id)}">
                Ver Detalle
              </button>

              <a href="detalleLibro.html?id=${escaparHtml(idLibro)}" class="btn btn-editar">
                Libro
              </a>
            </div>
          </td>
        </tr>
      `;
    });

    $("#tablaPrestamos").html(html);
  }

  $(document).on("click", ".btn-detalle-prestamo", function () {
    const id = $(this).data("id");

    const prestamo = prestamosGlobal.find(p => {
      return String(obtenerIdPrestamo(p)) === String(id);
    });

    if (!prestamo) {
      alert("No se encontró la información del préstamo seleccionado.");
      return;
    }

    const detallePrestamo = {
      id: obtenerIdPrestamo(prestamo),
      id_usuario: obtenerIdUsuarioPrestamo(prestamo),
      usuario: obtenerUsuarioPrestamo(prestamo),
      id_libro: obtenerIdLibroPrestamo(prestamo),
      libro: obtenerLibroPrestamo(prestamo),
      fecha_prestamo: obtenerFechaPrestamo(prestamo),
      fecha_devolucion: obtenerFechaDevolucionPrestamo(prestamo),
      estado: obtenerEstadoPrestamo(prestamo),
    };

    sessionStorage.setItem("detallePrestamo", JSON.stringify(detallePrestamo));

    window.location.href = `detallePrestamo.html?id=${encodeURIComponent(id)}`;
  });

  function filtrarPrestamos() {
    const usuario = normalizarTexto(
      $("#txtUsuarioPrestamo").val() || $("#txtUsuario").val(),
    );
    const estado = normalizarTexto(
      $("#txtEstadoPrestamo").val() || $("#txtEstado").val(),
    );
    const fechaInicio =
      $("#txtFechaInicioPrestamo").val() || $("#txtFechaInicio").val();
    const fechaFin = $("#txtFechaFinPrestamo").val() || $("#txtFechaFin").val();
    const ordenar = $("#txtOrdenarPrestamo").val() || $("#txtOrdenar").val();

    let filtrados = prestamosGlobal.filter(prestamo => {
      const usuarioPrestamo = normalizarTexto(obtenerUsuarioPrestamo(prestamo));
      const idUsuario = normalizarTexto(obtenerIdUsuarioPrestamo(prestamo));
      const estadoPrestamo = normalizarTexto(obtenerEstadoPrestamo(prestamo));
      const fechaPrestamo = fechaComparable(obtenerFechaPrestamo(prestamo));

      const cumpleUsuario =
        !usuario ||
        usuarioPrestamo.includes(usuario) ||
        idUsuario.includes(usuario);

      const cumpleEstado = !estado || estadoPrestamo === estado;
      const cumpleFechaInicio = !fechaInicio || fechaPrestamo >= fechaInicio;
      const cumpleFechaFin = !fechaFin || fechaPrestamo <= fechaFin;

      return (
        cumpleUsuario && cumpleEstado && cumpleFechaInicio && cumpleFechaFin
      );
    });

    filtrados = ordenarPrestamos(filtrados, ordenar);

    pintarPrestamos(filtrados);
  }

  function ordenarPrestamos(data, ordenar) {
    const copia = [...data];

    copia.sort((a, b) => {
      const fechaA = fechaComparable(obtenerFechaPrestamo(a));
      const fechaB = fechaComparable(obtenerFechaPrestamo(b));
      const libroA = normalizarTexto(obtenerLibroPrestamo(a));
      const libroB = normalizarTexto(obtenerLibroPrestamo(b));
      const estadoA = normalizarTexto(obtenerEstadoPrestamo(a));
      const estadoB = normalizarTexto(obtenerEstadoPrestamo(b));
      const usuarioA = normalizarTexto(obtenerUsuarioPrestamo(a));
      const usuarioB = normalizarTexto(obtenerUsuarioPrestamo(b));

      if (ordenar === "antigua" || ordenar === "Fecha más antigua") {
        return fechaA.localeCompare(fechaB);
      }

      if (ordenar === "libro" || ordenar === "Título del libro") {
        return libroA.localeCompare(libroB);
      }

      if (ordenar === "estado" || ordenar === "Estado") {
        return estadoA.localeCompare(estadoB);
      }

      if (ordenar === "usuario") {
        return usuarioA.localeCompare(usuarioB);
      }

      return fechaB.localeCompare(fechaA);
    });

    return copia;
  }

  $("#formPrestamos").on("submit", function (e) {
    e.preventDefault();
    filtrarPrestamos();
  });

  $("#formPrestamos").on("reset", function () {
    setTimeout(function () {
      pintarPrestamos(prestamosGlobal);
    }, 100);
  });

  $(
    "#txtUsuarioPrestamo, #txtEstadoPrestamo, #txtFechaInicioPrestamo, #txtFechaFinPrestamo, #txtOrdenarPrestamo, #txtUsuario, #txtEstado, #txtFechaInicio, #txtFechaFin, #txtOrdenar",
  ).on("change keyup", function () {
    filtrarPrestamos();
  });

  /* ===================== CAMPOS MULTAS ===================== */

  function obtenerIdMulta(multa) {
    return multa.id_multa ?? multa.id ?? "";
  }

  function obtenerIdUsuarioMulta(multa) {
    return multa.id_usuario ?? multa.usuario_id ?? "";
  }

  function obtenerUsuarioMulta(multa) {
    return (
      multa.usuario ??
      multa.nombre_usuario ??
      multa.nombre ??
      buscarNombreUsuarioPorId(obtenerIdUsuarioMulta(multa))
    );
  }

  function obtenerIdLibroMulta(multa) {
    return multa.id_libro ?? multa.libro_id ?? "";
  }

  function obtenerLibroMulta(multa) {
    return (
      multa.libro ??
      multa.titulo ??
      multa.titulo_libro ??
      multa.nombre_libro ??
      buscarTituloLibroPorId(obtenerIdLibroMulta(multa))
    );
  }

  function obtenerFechaDevolucionMulta(multa) {
    return multa.fecha_devolucion ?? "";
  }

  function obtenerTipoMulta(multa) {
    return multa.tipo ?? "";
  }

  function obtenerDiasGracia(multa) {
    return parseInt(multa.dias_gracia ?? 0, 10) || 0;
  }

  /* ===================== CÁLCULO MONTO MULTA ===================== */

  function calcularMonto(tipo, fechaDevolucion, diasGracia) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let daysLate = 0;

    if (fechaDevolucion) {
      const soloFecha = String(fechaDevolucion).split(" ")[0];
      const fecha = new Date(soloFecha + "T00:00:00");
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

  function obtenerMontoMulta(multa) {
    const tipo = obtenerTipoMulta(multa);
    const fechaDevolucion = obtenerFechaDevolucionMulta(multa);
    const diasGracia = obtenerDiasGracia(multa);

    return calcularMonto(tipo, fechaDevolucion, diasGracia);
  }

  /* ===================== MULTAS ===================== */

  function cargarMultas() {
    $.ajax({
      url: API_MULTAS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        console.log("MULTAS:", res);

        multasGlobal = obtenerData(res);
        pintarMultas(multasGlobal);
        cargarResumenMultas(multasGlobal);
      },
      error: function (xhr) {
        console.error("Error multas:", xhr.responseText);

        $("#tablaMultas").html(`
          <tr>
            <td colspan="7" style="text-align:center;">
              Error al cargar las multas.
            </td>
          </tr>
        `);

        $("#mensajeSinMultas").hide();
        cargarResumenMultas([]);
      },
    });
  }

  function pintarMultas(data) {
    let html = "";

    if (!data || data.length === 0) {
      $("#tablaMultas").html(`
        <tr>
          <td colspan="7" style="text-align:center;">
            No hay multas registradas.
          </td>
        </tr>
      `);

      $("#mensajeSinMultas").show();
      return;
    }

    $("#mensajeSinMultas").hide();

    data.forEach(multa => {
      const id = obtenerIdMulta(multa);
      const libro = obtenerLibroMulta(multa);
      const motivo = obtenerTipoMulta(multa);
      const monto = obtenerMontoMulta(multa);
      const fechaDevolucion = obtenerFechaDevolucionMulta(multa);
      const diasGracia = obtenerDiasGracia(multa);
      const claseBadge = obtenerClaseBadge(motivo);

      html += `
        <tr>
          <td>${escaparHtml(id)}</td>
          <td>${escaparHtml(libro)}</td>
          <td>
            <span class="${escaparHtml(claseBadge)}">
              ${escaparHtml(motivo)}
            </span>
          </td>
          <td>${escaparHtml(formatearMonto(monto))}</td>
          <td>${escaparHtml(formatearFecha(fechaDevolucion))}</td>
          <td>${escaparHtml(diasGracia)}</td>
          <td>
            <div class="acciones-tabla">
              <button type="button"
                class="btn btn-secondary btn-detalle-multa"
                data-id="${escaparHtml(id)}">
                Ver Detalle
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    $("#tablaMultas").html(html);
  }

  $(document).on("click", ".btn-detalle-multa", function () {
    const id = $(this).data("id");

    const multa = multasGlobal.find(m => {
      return String(obtenerIdMulta(m)) === String(id);
    });

    if (!multa) {
      alert("No se encontró la información de la multa seleccionada.");
      return;
    }

    const detalleMulta = {
      id: obtenerIdMulta(multa),
      id_usuario: obtenerIdUsuarioMulta(multa),
      usuario: obtenerUsuarioMulta(multa),
      id_libro: obtenerIdLibroMulta(multa),
      libro: obtenerLibroMulta(multa),
      tipo: obtenerTipoMulta(multa),
      motivo: obtenerTipoMulta(multa),
      fecha_devolucion: obtenerFechaDevolucionMulta(multa),
      dias_gracia: obtenerDiasGracia(multa),
      monto: obtenerMontoMulta(multa),
    };

    sessionStorage.setItem("detalleMulta", JSON.stringify(detalleMulta));

    window.location.href = `detalleMulta.html?id=${encodeURIComponent(id)}`;
  });

  function filtrarMultas() {
    const usuario = normalizarTexto($("#txtUsuarioMulta").val());
    const libro = normalizarTexto($("#txtLibroMulta").val());
    const tipo = normalizarTexto(
      $("#txtTipoMulta").val() || $("#txtEstadoMulta").val(),
    );
    const fechaInicio = $("#txtFechaInicioMulta").val();
    const fechaFin = $("#txtFechaFinMulta").val();

    const filtradas = multasGlobal.filter(multa => {
      const usuarioMulta = normalizarTexto(obtenerUsuarioMulta(multa));
      const idUsuario = normalizarTexto(obtenerIdUsuarioMulta(multa));
      const libroMulta = normalizarTexto(obtenerLibroMulta(multa));
      const idLibro = normalizarTexto(obtenerIdLibroMulta(multa));
      const tipoMulta = normalizarTexto(obtenerTipoMulta(multa));
      const fechaMulta = fechaComparable(obtenerFechaDevolucionMulta(multa));

      const cumpleUsuario =
        !usuario ||
        usuarioMulta.includes(usuario) ||
        idUsuario.includes(usuario);

      const cumpleLibro =
        !libro || libroMulta.includes(libro) || idLibro.includes(libro);

      const cumpleTipo = !tipo || tipoMulta === tipo;
      const cumpleFechaInicio = !fechaInicio || fechaMulta >= fechaInicio;
      const cumpleFechaFin = !fechaFin || fechaMulta <= fechaFin;

      return (
        cumpleUsuario &&
        cumpleLibro &&
        cumpleTipo &&
        cumpleFechaInicio &&
        cumpleFechaFin
      );
    });

    pintarMultas(filtradas);
    cargarResumenMultas(filtradas);
  }

  function cargarResumenMultas(data) {
    const total = data.length;

    const totalAtraso = data.filter(multa => {
      return normalizarTexto(obtenerTipoMulta(multa)) === "atraso";
    }).length;

    const totalDano = data.filter(multa => {
      return normalizarTexto(obtenerTipoMulta(multa)) === "daño";
    }).length;

    const totalPerdida = data.filter(multa => {
      return normalizarTexto(obtenerTipoMulta(multa)) === "perdida";
    }).length;

    const totalCalculado = data.reduce((acumulado, multa) => {
      return acumulado + obtenerMontoMulta(multa);
    }, 0);

    $("#totalMultas").val(total);
    $("#totalAtraso").val(totalAtraso);
    $("#totalDano").val(totalDano);
    $("#totalPerdida").val(totalPerdida);
    $("#totalCalculadoMultas").val(formatearMonto(totalCalculado));

    $("#multasPendientes").val(totalAtraso + totalDano + totalPerdida);
    $("#multasPagadas").val(0);
    $("#totalAdeudado").val(formatearMonto(totalCalculado));
  }

  $("#formMultas").on("submit", function (e) {
    e.preventDefault();
    filtrarMultas();
  });

  $("#formMultas").on("reset", function () {
    setTimeout(function () {
      pintarMultas(multasGlobal);
      cargarResumenMultas(multasGlobal);
    }, 100);
  });

  $(
    "#txtUsuarioMulta, #txtLibroMulta, #txtTipoMulta, #txtEstadoMulta, #txtFechaInicioMulta, #txtFechaFinMulta",
  ).on("change keyup", function () {
    filtrarMultas();
  });
});
