const API_MULTAS = "../../backend/api/multas.php";
const API_USUARIOS = "../../backend/api/usuarios.php";
const API_LIBROS = "../../backend/api/libros.php";

let usuariosGlobal = [];
let librosGlobal = [];

$(document).ready(function () {
  cargarDatosIniciales();

  /* ===================== CARGA INICIAL ===================== */

  function cargarDatosIniciales() {
    $.when(cargarUsuarios(), cargarLibros()).always(function () {
      cargarDetalleMulta();
    });
  }

  /* ===================== AUXILIARES ===================== */

  function obtenerParametroUrl(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
  }

  function obtenerData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.multas)) return res.multas;
    if (Array.isArray(res.usuarios)) return res.usuarios;
    if (Array.isArray(res.libros)) return res.libros;
    if (res.data && typeof res.data === "object") return res.data;
    if (res.multa && typeof res.multa === "object") return res.multa;
    if (res && typeof res === "object") return res;
    return null;
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

  function formatearMonto(monto) {
    const numero = Number(monto ?? 0);
    return "₡" + numero.toLocaleString("es-CR");
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

  /* ===================== CÁLCULO MONTO ===================== */

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

  /* ===================== CARGAR USUARIOS Y LIBROS ===================== */

  function cargarUsuarios() {
    return $.ajax({
      url: API_USUARIOS,
      method: "GET",
      dataType: "json",
      success: function (res) {
        usuariosGlobal = obtenerData(res) || [];
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
        librosGlobal = obtenerData(res) || [];
      },
      error: function (xhr) {
        console.error("Error libros:", xhr.responseText);
        librosGlobal = [];
      },
    });
  }

  /* ===================== DETALLE MULTA ===================== */

  function cargarDetalleMulta() {
    const idUrl = obtenerParametroUrl("id");

    const detalleGuardado = sessionStorage.getItem("detalleMulta");

    if (detalleGuardado) {
      try {
        const multa = JSON.parse(detalleGuardado);

        if (!idUrl || String(multa.id) === String(idUrl)) {
          pintarDetalle(multa);
          return;
        }
      } catch (error) {
        console.error("Error leyendo detalleMulta:", error);
      }
    }

    if (idUrl) {
      consultarMultaPorId(idUrl);
      return;
    }

    mostrarMensaje();
  }

  function consultarMultaPorId(id) {
    $.ajax({
      url: API_MULTAS,
      method: "GET",
      dataType: "json",
      data: {
        id: id,
      },
      success: function (res) {
        console.log("DETALLE MULTA:", res);

        const data = obtenerData(res);

        if (!data) {
          mostrarMensaje();
          return;
        }

        if (Array.isArray(data)) {
          const multa = data.find(m => {
            return String(m.id_multa ?? m.id) === String(id);
          });

          if (!multa) {
            mostrarMensaje();
            return;
          }

          pintarDetalle(normalizarMulta(multa));
          return;
        }

        pintarDetalle(normalizarMulta(data));
      },
      error: function (xhr) {
        console.error("Error consultando detalle multa:", xhr.responseText);
        mostrarMensaje();
      },
    });
  }

  function normalizarMulta(multa) {
    const idUsuario = multa.id_usuario ?? multa.usuario_id ?? "";
    const idLibro = multa.id_libro ?? multa.libro_id ?? "";
    const tipo = multa.tipo ?? "";
    const fechaDevolucion = multa.fecha_devolucion ?? "";
    const diasGracia = parseInt(multa.dias_gracia ?? 0, 10) || 0;
    const monto = calcularMonto(tipo, fechaDevolucion, diasGracia);

    return {
      id: multa.id_multa ?? multa.id ?? "",
      id_usuario: idUsuario,
      usuario:
        multa.usuario ??
        multa.nombre_usuario ??
        multa.nombre ??
        buscarNombreUsuarioPorId(idUsuario),
      id_libro: idLibro,
      libro:
        multa.libro ??
        multa.titulo ??
        multa.titulo_libro ??
        multa.nombre_libro ??
        buscarTituloLibroPorId(idLibro),
      tipo: tipo,
      motivo: tipo,
      fecha_devolucion: fechaDevolucion,
      dias_gracia: diasGracia,
      monto: monto,
    };
  }

  function pintarDetalle(multa) {
    if (!multa) {
      mostrarMensaje();
      return;
    }

    ocultarMensaje();

    $("#txtIdMulta").val(multa.id ?? "");
    $("#txtUsuarioMulta").val(multa.usuario ?? "");
    $("#txtIdUsuario").val(multa.id_usuario ?? "");
    $("#txtLibroMulta").val(multa.libro ?? "");
    $("#txtIdLibro").val(multa.id_libro ?? "");
    $("#txtMotivoMulta").val(multa.motivo ?? multa.tipo ?? "");
    $("#txtFechaDevolucion").val(formatearFecha(multa.fecha_devolucion));
    $("#txtMontoMulta").val(formatearMonto(multa.monto));
  }

  function limpiarCampos() {
    $("#txtIdMulta").val("");
    $("#txtUsuarioMulta").val("");
    $("#txtIdUsuario").val("");
    $("#txtLibroMulta").val("");
    $("#txtIdLibro").val("");
    $("#txtMotivoMulta").val("");
    $("#txtFechaDevolucion").val("");
    $("#txtMontoMulta").val("");
  }

  function mostrarMensaje() {
    $("#mensajeDetalleMulta").show();
    limpiarCampos();
  }

  function ocultarMensaje() {
    $("#mensajeDetalleMulta").hide();
  }

  /* ===================== BOTONES ===================== */

  $("#btnVolver").click(function () {
    window.history.back();
  });

  $("#btnVerLibro").click(function () {
    const idLibro = $("#txtIdLibro").val();

    if (!idLibro) {
      alert("No se encontró el libro asociado a esta multa.");
      return;
    }

    window.location.href = `detalleLibro.html?id=${encodeURIComponent(idLibro)}`;
  });
});
