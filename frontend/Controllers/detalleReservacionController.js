const API_RESERVAS = "../../backend/api/reservas.php";
const API_USUARIOS = "../../backend/api/usuarios.php";
const API_LIBROS = "../../backend/api/libros.php";

let usuariosGlobal = [];
let librosGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  cargarDetalle();

  const btnVolver = document.getElementById("btnVolver");
  const btnIrReservas = document.getElementById("btnIrReservas");
  const btnVerLibro = document.getElementById("btnVerLibro");

  if (btnVolver) {
    btnVolver.addEventListener("click", function () {
      window.history.back();
    });
  }

  if (btnIrReservas) {
    btnIrReservas.addEventListener("click", function () {
      window.location.href = "reservas.html";
    });
  }

  if (btnVerLibro) {
    btnVerLibro.addEventListener("click", function () {
      const idLibro = document.getElementById("txtIdLibro").value;

      if (!idLibro) {
        alert("No se encontró el libro asociado a esta reservación.");
        return;
      }

      window.location.href = `detalleLibro.html?id=${encodeURIComponent(idLibro)}`;
    });
  }
});

/* ===================== CARGA PRINCIPAL ===================== */

async function cargarDetalle() {
  try {
    const id = obtenerParametroUrl("id");

    if (!id) {
      mostrarError();
      return;
    }

    const usuariosRes = await consultarApi(API_USUARIOS);
    const librosRes = await consultarApi(API_LIBROS);

    usuariosGlobal = obtenerData(usuariosRes);
    librosGlobal = obtenerData(librosRes);

    const reserva = await obtenerReservaPorId(id);

    if (!reserva) {
      mostrarError();
      return;
    }

    pintarDetalle(reserva);

  } catch (error) {
    console.error("Error cargando detalle de reservación:", error);
    mostrarError();
  }
}

async function obtenerReservaPorId(id) {
  const resPorId = await consultarApi(`${API_RESERVAS}?id=${encodeURIComponent(id)}`);
  let dataPorId = obtenerData(resPorId);

  if (Array.isArray(dataPorId) && dataPorId.length > 0) {
    const encontrada = dataPorId.find(r => {
      return String(obtenerIdReserva(r)) === String(id);
    });

    if (encontrada) return encontrada;
  }

  if (resPorId && resPorId.data && typeof resPorId.data === "object" && !Array.isArray(resPorId.data)) {
    return resPorId.data;
  }

  const resTodas = await consultarApi(API_RESERVAS);
  const todas = obtenerData(resTodas);

  return todas.find(r => {
    return String(obtenerIdReserva(r)) === String(id);
  });
}

async function consultarApi(url) {
  try {
    const respuesta = await fetch(url, {
      method: "GET"
    });

    if (!respuesta.ok) {
      console.error("Error HTTP:", url, respuesta.status);
      return [];
    }

    const texto = await respuesta.text();

    if (!texto) {
      return [];
    }

    try {
      return JSON.parse(texto);
    } catch (error) {
      console.error("JSON inválido:", url, texto);
      return [];
    }
  } catch (error) {
    console.error("Error consultando API:", url, error);
    return [];
  }
}

function obtenerData(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.reservas)) return res.reservas;
  if (Array.isArray(res.usuarios)) return res.usuarios;
  if (Array.isArray(res.libros)) return res.libros;
  return [];
}

/* ===================== CAMPOS RESERVA ===================== */

function obtenerIdReserva(reserva) {
  return reserva.id_reserva ?? reserva.id ?? "";
}

function obtenerIdUsuarioReserva(reserva) {
  return reserva.id_usuario ?? reserva.usuario_id ?? "";
}

function obtenerIdLibroReserva(reserva) {
  return reserva.id_libro ?? reserva.libro_id ?? "";
}

function obtenerUsuarioReserva(reserva) {
  return (
    reserva.usuario ??
    reserva.nombre_usuario ??
    reserva.nombre ??
    buscarNombreUsuarioPorId(obtenerIdUsuarioReserva(reserva))
  );
}

function obtenerLibroReserva(reserva) {
  return (
    reserva.libro ??
    reserva.titulo ??
    reserva.titulo_libro ??
    reserva.nombre_libro ??
    buscarTituloLibroPorId(obtenerIdLibroReserva(reserva))
  );
}

function obtenerEstadoLibroReserva(reserva) {
  return reserva.estado_reserva ?? reserva.estado_libro ?? "";
}

function obtenerEstadoReserva(reserva) {
  return reserva.estado ?? "";
}

function obtenerFechaReserva(reserva) {
  return reserva.fecha_reserva ?? reserva.fecha ?? "";
}

function obtenerFechaLimite(reserva) {
  return reserva.fecha_limite ?? "";
}

function obtenerPosicion(reserva) {
  const posicion = Number(reserva.posicion_lista_espera ?? reserva.posicion ?? 0);

  if (posicion <= 0) {
    return "No aplica";
  }

  return posicion;
}

function obtenerObservaciones(reserva) {
  return reserva.observaciones ?? "Sin observaciones registradas.";
}

/* ===================== USUARIOS Y LIBROS ===================== */

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

function buscarNombreUsuarioPorId(idUsuario) {
  const usuario = usuariosGlobal.find(u => {
    return String(obtenerIdUsuario(u)) === String(idUsuario);
  });

  if (!usuario) {
    return idUsuario ? `Usuario ${idUsuario}` : "Sin usuario";
  }

  return obtenerNombreUsuario(usuario);
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

function buscarTituloLibroPorId(idLibro) {
  const libro = librosGlobal.find(l => {
    return String(obtenerIdLibro(l)) === String(idLibro);
  });

  if (!libro) {
    return idLibro ? `Libro ${idLibro}` : "Sin libro";
  }

  return obtenerTituloLibro(libro);
}

/* ===================== PINTAR ===================== */

function pintarDetalle(reserva) {
  ocultarError();

  const id = obtenerIdReserva(reserva);
  const idUsuario = obtenerIdUsuarioReserva(reserva);
  const idLibro = obtenerIdLibroReserva(reserva);
  const usuario = obtenerUsuarioReserva(reserva);
  const libro = obtenerLibroReserva(reserva);
  const estadoLibro = obtenerEstadoLibroReserva(reserva);
  const estadoReserva = obtenerEstadoReserva(reserva);
  const fechaReserva = obtenerFechaReserva(reserva);
  const fechaLimite = obtenerFechaLimite(reserva);
  const posicion = obtenerPosicion(reserva);
  const observaciones = obtenerObservaciones(reserva);

  setValue("txtIdReserva", id);
  setValue("txtUsuario", usuario);
  setValue("txtIdUsuario", idUsuario);
  setValue("txtLibro", libro);
  setValue("txtIdLibro", idLibro);
  setValue("txtEstadoLibro", estadoLibro);
  setValue("txtFechaReserva", formatearFecha(fechaReserva));
  setValue("txtFechaLimite", formatearFecha(fechaLimite));
  setValue("txtPosicion", posicion);
  setValue("txtEstadoReserva", estadoReserva);
  setValue("txtObservaciones", observaciones);

  const titulo = document.getElementById("tituloReserva");
  const subtitulo = document.getElementById("subtituloReserva");
  const badge = document.getElementById("badgeEstadoReserva");

  if (titulo) {
    titulo.textContent = `Reserva #${id}`;
  }

  if (subtitulo) {
    subtitulo.textContent = `${usuario} reservó el libro "${libro}".`;
  }

  if (badge) {
    badge.textContent = estadoReserva || "Sin estado";
    badge.className = obtenerClaseBadge(estadoReserva);
  }
}

function setValue(id, value) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.value = value ?? "";
  }
}

function mostrarError() {
  const mensaje = document.getElementById("mensajeDetalle");
  const contenido = document.getElementById("contenidoDetalle");

  if (mensaje) {
    mensaje.style.display = "block";
  }

  if (contenido) {
    contenido.style.display = "none";
  }
}

function ocultarError() {
  const mensaje = document.getElementById("mensajeDetalle");
  const contenido = document.getElementById("contenidoDetalle");

  if (mensaje) {
    mensaje.style.display = "none";
  }

  if (contenido) {
    contenido.style.display = "block";
  }
}

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

function normalizarTexto(texto) {
  return String(texto ?? "").toLowerCase().trim();
}

function obtenerClaseBadge(estado) {
  const estadoNormalizado = normalizarTexto(estado);

  if (estadoNormalizado === "activo" || estadoNormalizado === "activa") {
    return "badge badge-disponible";
  }

  if (estadoNormalizado === "en espera") {
    return "badge badge-reservado";
  }

  if (
    estadoNormalizado === "cancelado" ||
    estadoNormalizado === "finalizado" ||
    estadoNormalizado === "inactivo"
  ) {
    return "badge badge-no-disponible";
  }

  return "badge";
}