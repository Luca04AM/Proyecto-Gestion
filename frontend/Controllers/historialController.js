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

  function cargarDatosIniciales() {
    $.when(cargarUsuarios(), cargarLibros()).always(function () {
      cargarPrestamos();
      cargarMultas();
    });
  }

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

  function fechaEnRango(fecha, fechaInicio, fechaFin) {
    const fechaBase = fechaComparable(fecha);

    if (!fechaBase) {
      return false;
    }

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      const temporal = fechaInicio;
      fechaInicio = fechaFin;
      fechaFin = temporal;
    }

    if (fechaInicio && fechaBase < fechaInicio) {
      return false;
    }

    if (fechaFin && fechaBase > fechaFin) {
      return false;
    }

    return true;
  }

  function prestamoCoincideConFechas(prestamo, fechaInicio, fechaFin) {
    if (!fechaInicio && !fechaFin) {
      return true;
    }

    const fechaPrestamo = fechaComparable(obtenerFechaPrestamo(prestamo));
    const fechaDevolucion = fechaComparable(
      obtenerFechaDevolucionPrestamo(prestamo),
    );

    if (fechaInicio && !fechaFin) {
      return fechaPrestamo === fechaInicio || fechaDevolucion === fechaInicio;
    }

    if (!fechaInicio && fechaFin) {
      return fechaPrestamo === fechaFin || fechaDevolucion === fechaFin;
    }

    return (
      fechaEnRango(fechaPrestamo, fechaInicio, fechaFin) ||
      fechaEnRango(fechaDevolucion, fechaInicio, fechaFin)
    );
  }

  function formatearMonto(monto) {
    const numero = Number(monto ?? 0);
    return "₡" + numero.toLocaleString("es-CR");
  }

  function obtenerClaseBadge(valor) {
    const valorNormalizado = normalizarTexto(valor);

    if (valorNormalizado === "devuelto" || valorNormalizado === "pagada") {
      return "badge badge-disponible";
    }

    if (
      valorNormalizado === "prestado" ||
      valorNormalizado === "pendiente" ||
      valorNormalizado === "atraso"
    ) {
      return "badge badge-reservado";
    }

    if (
      valorNormalizado === "perdido" ||
      valorNormalizado === "perdida" ||
      valorNormalizado === "daño"
    ) {
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

      $("#mensajeSinRegistros").show();
      return;
    }

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

              <a href="detalleLibro.html?id=${escaparHtml(idLibro)}" class="btn btn-primary">
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
    const usuario = normalizarTexto($("#txtUsuario").val());
    const estado = normalizarTexto($("#txtEstado").val());
    const fechaInicio = $("#txtFechaInicio").val();
    const fechaFin = $("#txtFechaFin").val();
    const ordenar = $("#txtOrdenar").val();

    let filtrados = prestamosGlobal.filter(prestamo => {
      const usuarioPrestamo = normalizarTexto(obtenerUsuarioPrestamo(prestamo));
      const idUsuario = normalizarTexto(obtenerIdUsuarioPrestamo(prestamo));
      const estadoPrestamo = normalizarTexto(obtenerEstadoPrestamo(prestamo));

      const cumpleUsuario =
        !usuario ||
        usuarioPrestamo.includes(usuario) ||
        idUsuario.includes(usuario);

      const cumpleEstado = !estado || estadoPrestamo === estado;

      const cumpleFecha = prestamoCoincideConFechas(
        prestamo,
        fechaInicio,
        fechaFin,
      );

      return cumpleUsuario && cumpleEstado && cumpleFecha;
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

      if (ordenar === "antigua") {
        return fechaA.localeCompare(fechaB);
      }

      if (ordenar === "libro") {
        return libroA.localeCompare(libroB);
      }

      if (ordenar === "estado") {
        return estadoA.localeCompare(estadoB);
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

  $("#txtUsuario, #txtEstado, #txtFechaInicio, #txtFechaFin, #txtOrdenar").on(
    "change keyup",
    function () {
      filtrarPrestamos();
    },
  );

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

  function obtenerEstadoMulta(multa) {
    return multa.estado ?? "Pendiente";
  }

  function obtenerMontoPagado(multa) {
    const montoPagado = multa.monto_pagado;

    if (
      montoPagado === null ||
      montoPagado === undefined ||
      montoPagado === ""
    ) {
      return 0;
    }

    return Number(montoPagado) || 0;
  }

  function calcularMonto(tipo, fechaDevolucion, diasGracia) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let diasAtraso = 0;

    if (fechaDevolucion) {
      const soloFecha = String(fechaDevolucion).split(" ")[0];
      const fecha = new Date(soloFecha + "T00:00:00");
      fecha.setHours(0, 0, 0, 0);

      const diffMs = hoy - fecha;

      if (diffMs > 0) {
        diasAtraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    const diasCobro = Math.max(diasAtraso - diasGracia, 1);

    let montoBase = 1000;

    if (tipo === "Daño") {
      montoBase = 3000;
    }

    if (tipo === "Perdida") {
      montoBase = 10000;
    }

    return montoBase * diasCobro;
  }

  function obtenerMontoMulta(multa) {
    return calcularMonto(
      obtenerTipoMulta(multa),
      obtenerFechaDevolucionMulta(multa),
      obtenerDiasGracia(multa),
    );
  }

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
            <td colspan="9" style="text-align:center;">
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
          <td colspan="9" style="text-align:center;">
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
      const estado = obtenerEstadoMulta(multa);
      const montoPagado = obtenerMontoPagado(multa);
      const claseMotivo = obtenerClaseBadge(motivo);
      const claseEstado = obtenerClaseBadge(estado);

      const botonPago =
        normalizarTexto(estado) === "pagada"
          ? `
          <button type="button"
            class="btn btn-secondary btn-marcar-pendiente"
            data-id="${escaparHtml(id)}">
            Marcar pendiente
          </button>
        `
          : `
          <button type="button"
            class="btn btn-primary btn-pagar-multa"
            data-id="${escaparHtml(id)}">
            Registrar pago
          </button>
        `;

      html += `
        <tr>
          <td>${escaparHtml(id)}</td>
          <td>${escaparHtml(libro)}</td>
          <td>
            <span class="${escaparHtml(claseMotivo)}">
              ${escaparHtml(motivo)}
            </span>
          </td>
          <td>${escaparHtml(formatearMonto(monto))}</td>
          <td>${escaparHtml(formatearFecha(fechaDevolucion))}</td>
          <td>${escaparHtml(diasGracia)}</td>
          <td>
            <span class="${escaparHtml(claseEstado)}">
              ${escaparHtml(estado)}
            </span>
          </td>
          <td>${escaparHtml(formatearMonto(montoPagado))}</td>
          <td>
            <div class="acciones-tabla">
              <button type="button"
                class="btn btn-secondary btn-detalle-multa"
                data-id="${escaparHtml(id)}">
                Ver Detalle
              </button>

              ${botonPago}
            </div>
          </td>
        </tr>
      `;
    });

    $("#tablaMultas").html(html);
  }

  function cargarResumenMultas(data) {
    const total = data.length;

    const pendientes = data.filter(multa => {
      return normalizarTexto(obtenerEstadoMulta(multa)) === "pendiente";
    }).length;

    const pagadas = data.filter(multa => {
      return normalizarTexto(obtenerEstadoMulta(multa)) === "pagada";
    }).length;

    const totalAdeudado = data.reduce((acumulado, multa) => {
      const estado = normalizarTexto(obtenerEstadoMulta(multa));
      const monto = obtenerMontoMulta(multa);
      const pagado = obtenerMontoPagado(multa);

      if (estado === "pagada") {
        return acumulado;
      }

      return acumulado + Math.max(monto - pagado, 0);
    }, 0);

    $("#totalMultas").val(total);
    $("#multasPendientes").val(pendientes);
    $("#multasPagadas").val(pagadas);
    $("#totalAdeudado").val(formatearMonto(totalAdeudado));
  }

  $("#formMultas").on("submit", function (e) {
    e.preventDefault();
  });

  $("#formMultas").on("reset", function () {
    setTimeout(function () {
      pintarMultas(multasGlobal);
      cargarResumenMultas(multasGlobal);
    }, 100);
  });
});
