const API_PRESTAMOS = "../../backend/api/prestamos.php";
const API_MULTAS = "../../backend/api/multas.php";
const API_RESERVAS = "../../backend/api/reservas.php";
const API_USUARIOS = "../../backend/api/usuarios.php";
const API_LIBROS = "../../backend/api/libros.php";

let prestamosGlobal = [];
let multasGlobal = [];
let reservasGlobal = [];
let usuariosGlobal = [];
let librosGlobal = [];
let notificacionesGlobal = [];

const STORAGE_NOTIFICACIONES = "sigab_notificaciones_estado";
const DIAS_PROXIMA_DEVOLUCION = 3;

document.addEventListener("DOMContentLoaded", function () {
  console.log("notificacionesController.js dinámico cargado");

  pintarCargando();
  cargarDatosIniciales();

  const buscador = document.getElementById("txtBuscarNotificacion");

  if (buscador) {
    buscador.addEventListener("keyup", function () {
      filtrarNotificaciones();
    });
  }
});

/* ===================== CARGA INICIAL ===================== */

async function cargarDatosIniciales() {
  try {
    const usuarios = await consultarApi(API_USUARIOS);
    const libros = await consultarApi(API_LIBROS);
    const prestamos = await consultarApi(API_PRESTAMOS);
    const multas = await consultarApi(API_MULTAS);
    const reservas = await consultarApi(API_RESERVAS);

    usuariosGlobal = obtenerData(usuarios);
    librosGlobal = obtenerData(libros);
    prestamosGlobal = obtenerData(prestamos);
    multasGlobal = obtenerData(multas);
    reservasGlobal = obtenerData(reservas);

    console.log("USUARIOS:", usuariosGlobal);
    console.log("LIBROS:", librosGlobal);
    console.log("PRÉSTAMOS:", prestamosGlobal);
    console.log("MULTAS:", multasGlobal);
    console.log("RESERVAS:", reservasGlobal);

    generarNotificaciones();
  } catch (error) {
    console.error("Error cargando datos de notificaciones:", error);
    pintarSinNotificaciones();
  }
}

async function consultarApi(url) {
  try {
    const respuesta = await fetch(url, {
      method: "GET",
    });

    if (!respuesta.ok) {
      console.error("Error HTTP consultando:", url, respuesta.status);
      return [];
    }

    const texto = await respuesta.text();

    if (!texto) {
      return [];
    }

    try {
      return JSON.parse(texto);
    } catch (errorJson) {
      console.error("La API no devolvió JSON válido:", url, texto);
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
  if (Array.isArray(res.prestamos)) return res.prestamos;
  if (Array.isArray(res.multas)) return res.multas;
  if (Array.isArray(res.reservas)) return res.reservas;
  if (Array.isArray(res.usuarios)) return res.usuarios;
  if (Array.isArray(res.libros)) return res.libros;
  return [];
}

/* ===================== AUXILIARES ===================== */

function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .trim();
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

function fechaSoloDia(fecha) {
  if (!fecha) return null;

  const soloFecha = String(fecha).split(" ")[0];
  const fechaObjeto = new Date(soloFecha + "T00:00:00");

  if (isNaN(fechaObjeto.getTime())) {
    return null;
  }

  fechaObjeto.setHours(0, 0, 0, 0);
  return fechaObjeto;
}

function obtenerHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

function diferenciaDias(fecha) {
  const hoy = obtenerHoy();
  const fechaObjeto = fechaSoloDia(fecha);

  if (!fechaObjeto) return 9999;

  const diffMs = fechaObjeto - hoy;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function fechaYaPaso(fecha) {
  const fechaObjeto = fechaSoloDia(fecha);

  if (!fechaObjeto) return false;

  return fechaObjeto < obtenerHoy();
}

function fechaProxima(fecha) {
  const dias = diferenciaDias(fecha);
  return dias >= 0 && dias <= DIAS_PROXIMA_DEVOLUCION;
}

function formatearMonto(monto) {
  const numero = Number(monto ?? 0);
  return "₡" + numero.toLocaleString("es-CR");
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

/* ===================== LOCAL STORAGE ===================== */

function obtenerEstadoStorage() {
  const texto = localStorage.getItem(STORAGE_NOTIFICACIONES);

  if (!texto) return {};

  try {
    return JSON.parse(texto);
  } catch (error) {
    console.error("Error leyendo localStorage:", error);
    return {};
  }
}

function guardarEstadoStorage(estado) {
  localStorage.setItem(STORAGE_NOTIFICACIONES, JSON.stringify(estado));
}

/* ===================== PRÉSTAMOS ===================== */

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

function obtenerFechaDevolucionPrestamo(prestamo) {
  return prestamo.fecha_devolucion ?? prestamo.fecha_limite ?? "";
}

function obtenerEstadoPrestamo(prestamo) {
  return prestamo.estado ?? prestamo.estado_prestamo ?? "";
}

/* ===================== MULTAS ===================== */

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

function calcularMonto(tipo, fechaDevolucion, diasGracia) {
  const hoy = obtenerHoy();

  let daysLate = 0;

  if (fechaDevolucion) {
    const fecha = fechaSoloDia(fechaDevolucion);

    if (fecha) {
      const diffMs = hoy - fecha;

      if (diffMs > 0) {
        daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
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
  return calcularMonto(
    obtenerTipoMulta(multa),
    obtenerFechaDevolucionMulta(multa),
    obtenerDiasGracia(multa),
  );
}

/* ===================== RESERVAS ===================== */

function obtenerIdReserva(reserva) {
  return reserva.id_reserva ?? reserva.id ?? "";
}

function obtenerIdUsuarioReserva(reserva) {
  return reserva.id_usuario ?? reserva.usuario_id ?? "";
}

function obtenerUsuarioReserva(reserva) {
  return (
    reserva.usuario ??
    reserva.nombre_usuario ??
    reserva.nombre ??
    buscarNombreUsuarioPorId(obtenerIdUsuarioReserva(reserva))
  );
}

function obtenerIdLibroReserva(reserva) {
  return reserva.id_libro ?? reserva.libro_id ?? "";
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

function obtenerEstadoReserva(reserva) {
  return reserva.estado ?? "";
}

function obtenerEstadoLibroReserva(reserva) {
  return reserva.estado_reserva ?? reserva.estado_libro ?? "";
}

function obtenerFechaReserva(reserva) {
  return reserva.fecha_reserva ?? reserva.fecha ?? "";
}

/* ===================== GENERAR NOTIFICACIONES ===================== */

function generarNotificaciones() {
  const estadoGuardado = obtenerEstadoStorage();

  let generadas = [];

  prestamosGlobal.forEach(prestamo => {
    const estado = normalizarTexto(obtenerEstadoPrestamo(prestamo));
    const id = obtenerIdPrestamo(prestamo);
    const libro = obtenerLibroPrestamo(prestamo);
    const usuario = obtenerUsuarioPrestamo(prestamo);
    const fechaDevolucion = obtenerFechaDevolucionPrestamo(prestamo);

    if (estado === "prestado" && fechaProxima(fechaDevolucion)) {
      generadas.push(
        crearNotificacion({
          id: `prestamo-proximo-${id}`,
          tipo: "Devolución Próxima",
          categoria: "proxima",
          titulo: "Devolución Próxima",
          libro: libro,
          usuario: usuario,
          fecha: fechaDevolucion,
          detalle: `El préstamo del libro "${libro}" tiene una fecha de devolución próxima.`,
          enlace: `detallePrestamo.html?id=${encodeURIComponent(id)}`,
        }),
      );
    }

    if (estado === "prestado" && fechaYaPaso(fechaDevolucion)) {
      generadas.push(
        crearNotificacion({
          id: `prestamo-atrasado-${id}`,
          tipo: "Préstamo Atrasado",
          categoria: "atrasado",
          titulo: "Préstamo Atrasado",
          libro: libro,
          usuario: usuario,
          fecha: fechaDevolucion,
          detalle: `El usuario no ha devuelto el libro "${libro}" en la fecha establecida.`,
          enlace: `detallePrestamo.html?id=${encodeURIComponent(id)}`,
        }),
      );
    }
  });

  multasGlobal.forEach(multa => {
    const id = obtenerIdMulta(multa);
    const libro = obtenerLibroMulta(multa);
    const usuario = obtenerUsuarioMulta(multa);
    const tipo = obtenerTipoMulta(multa);
    const fecha = obtenerFechaDevolucionMulta(multa);
    const monto = obtenerMontoMulta(multa);

    generadas.push(
      crearNotificacion({
        id: `multa-generada-${id}`,
        tipo: "Multa Generada",
        categoria: "multa",
        titulo: "Multa Generada",
        libro: libro,
        usuario: usuario,
        fecha: fecha,
        monto: monto,
        detalle: `Se generó una multa de tipo "${tipo}" para el libro "${libro}".`,
        enlace: `detalleMulta.html?id=${encodeURIComponent(id)}`,
      }),
    );
  });

  reservasGlobal.forEach(reserva => {
    const id = obtenerIdReserva(reserva);
    const libro = obtenerLibroReserva(reserva);
    const usuario = obtenerUsuarioReserva(reserva);
    const estadoReserva = normalizarTexto(obtenerEstadoReserva(reserva));
    const estadoLibro = normalizarTexto(obtenerEstadoLibroReserva(reserva));
    const fecha = obtenerFechaReserva(reserva);

    const esReservaActiva =
      estadoReserva === "activo" ||
      estadoReserva === "activa" ||
      estadoReserva === "en espera";

    const libroDisponible =
      estadoLibro === "disponible" || estadoLibro === "reservado";

    if (esReservaActiva && libroDisponible) {
      generadas.push(
        crearNotificacion({
          id: `reserva-disponible-${id}`,
          tipo: "Reserva Disponible",
          categoria: "reserva",
          titulo: "Reserva Disponible",
          libro: libro,
          usuario: usuario,
          fecha: fecha,
          detalle: `El libro "${libro}" reservado por el usuario ya puede ser retirado.`,
          enlace: `detalleReservacion.html?id=${encodeURIComponent(id)}`,
        }),
      );
    }
  });

  generadas = aplicarEstadoGuardado(generadas, estadoGuardado);

  notificacionesGlobal = generadas.filter(n => !n.eliminada);

  pintarNotificaciones(notificacionesGlobal);
}

function crearNotificacion(datos) {
  return {
    id: datos.id,
    tipo: datos.tipo,
    categoria: datos.categoria,
    titulo: datos.titulo,
    libro: datos.libro,
    usuario: datos.usuario,
    fecha: datos.fecha,
    monto: datos.monto ?? null,
    detalle: datos.detalle,
    enlace: datos.enlace,
    leida: false,
    eliminada: false,
    fecha_generada: new Date().toISOString(),
  };
}

function aplicarEstadoGuardado(notificaciones, estadoGuardado) {
  return notificaciones.map(notificacion => {
    const estado = estadoGuardado[notificacion.id];

    if (estado) {
      notificacion.leida = estado.leida ?? false;
      notificacion.eliminada = estado.eliminada ?? false;
    }

    return notificacion;
  });
}

/* ===================== PINTAR ===================== */

function pintarCargando() {
  const contenedor = document.getElementById("contenedorNotificaciones");

  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="card sin-notificaciones">
      <h3>Cargando notificaciones...</h3>
      <p>Espere un momento mientras se consultan los registros del sistema.</p>
    </div>
  `;
}

function pintarSinNotificaciones() {
  const contenedor = document.getElementById("contenedorNotificaciones");
  const mensaje = document.getElementById("mensajeSinNotificaciones");

  if (contenedor) {
    contenedor.innerHTML = "";
  }

  if (mensaje) {
    mensaje.style.display = "block";
  }
}

function pintarNotificaciones(data) {
  const contenedor = document.getElementById("contenedorNotificaciones");
  const mensaje = document.getElementById("mensajeSinNotificaciones");

  if (!contenedor) {
    console.error("No existe contenedorNotificaciones.");
    return;
  }

  let html = "";

  if (!data || data.length === 0) {
    contenedor.innerHTML = "";

    if (mensaje) {
      mensaje.style.display = "block";
    }

    return;
  }

  if (mensaje) {
    mensaje.style.display = "none";
  }

  data.forEach(notificacion => {
    const claseCard = obtenerClaseCard(
      notificacion.categoria,
      notificacion.leida,
    );
    const claseBadge = notificacion.leida
      ? "badge badge-disponible"
      : "badge badge-atrasado";
    const textoEstado = notificacion.leida ? "Leída" : "No Leída";
    const icono = obtenerIcono(notificacion.categoria);

    const botonMarcarLeida = notificacion.leida
      ? ""
      : `
        <button type="button"
          class="btn btn-secondary btn-marcar-leida"
          data-id="${escaparHtml(notificacion.id)}">
          Marcar Leída
        </button>
      `;

    const montoHtml =
      notificacion.monto !== null
        ? `
        <p>
          <strong>Monto:</strong>
          ${escaparHtml(formatearMonto(notificacion.monto))}
        </p>
      `
        : "";

    html += `
      <div class="card notificacion-card ${escaparHtml(claseCard)}">

        <div class="notificacion-icono">
          <img src="${escaparHtml(icono)}" alt="${escaparHtml(notificacion.tipo)}">
        </div>

        <div class="notificacion-info">

          <h3>${escaparHtml(notificacion.titulo)}</h3>

          <p>
            <strong>Libro:</strong>
            ${escaparHtml(notificacion.libro)}
          </p>

          <p>
            <strong>Usuario:</strong>
            ${escaparHtml(notificacion.usuario)}
          </p>

          <p>
            <strong>Fecha:</strong>
            ${escaparHtml(formatearFecha(notificacion.fecha))}
          </p>

          ${montoHtml}

          <div class="estado-notificacion">
            <span class="${escaparHtml(claseBadge)}">
              ${escaparHtml(textoEstado)}
            </span>
          </div>

        </div>

        <div class="notificacion-acciones">

          <button type="button"
            class="btn btn-primary btn-ver-detalle"
            data-id="${escaparHtml(notificacion.id)}">
            Ver Detalle
          </button>

          ${botonMarcarLeida}

          <button type="button"
            class="btn btn-accent btn-eliminar-notificacion"
            data-id="${escaparHtml(notificacion.id)}">
            Eliminar
          </button>

        </div>

      </div>
    `;
  });

  contenedor.innerHTML = html;
}

function obtenerClaseCard(categoria, leida) {
  if (leida) return "leida";
  if (categoria === "proxima") return "proxima";
  if (categoria === "atrasado") return "atrasado";
  if (categoria === "multa") return "multa";
  if (categoria === "reserva") return "reserva";
  return "";
}

function obtenerIcono(categoria) {
  if (categoria === "proxima") return "../img/autores/devolucion.png";
  if (categoria === "atrasado") return "../img/autores/donacion.png";
  if (categoria === "multa") return "../img/autores/cuenta.png";
  if (categoria === "reserva") return "../img/autores/calendario.png";
  return "../img/autores/calendario.png";
}

/* ===================== ACCIONES ===================== */

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-marcar-leida")) {
    const id = e.target.dataset.id;

    cambiarEstadoNotificacion(id, {
      leida: true,
      eliminada: false,
    });

    generarNotificaciones();
  }

  if (e.target.classList.contains("btn-eliminar-notificacion")) {
    const id = e.target.dataset.id;

    if (!confirm("¿Deseas eliminar esta notificación?")) {
      return;
    }

    cambiarEstadoNotificacion(id, {
      leida: true,
      eliminada: true,
    });

    generarNotificaciones();
  }

  if (e.target.classList.contains("btn-ver-detalle")) {
    const id = e.target.dataset.id;

    const notificacion = notificacionesGlobal.find(n => {
      return String(n.id) === String(id);
    });

    if (!notificacion) {
      alert("No se encontró la notificación seleccionada.");
      return;
    }

    cambiarEstadoNotificacion(id, {
      leida: true,
      eliminada: false,
    });

    sessionStorage.setItem("detalleNotificacion", JSON.stringify(notificacion));

    window.location.href = notificacion.enlace;
  }
});

function cambiarEstadoNotificacion(id, nuevoEstado) {
  const estadoGuardado = obtenerEstadoStorage();

  estadoGuardado[id] = {
    ...(estadoGuardado[id] ?? {}),
    ...nuevoEstado,
    fecha_actualizacion: new Date().toISOString(),
  };

  guardarEstadoStorage(estadoGuardado);
}

/* ===================== BUSCADOR ===================== */

function filtrarNotificaciones() {
  const input = document.getElementById("txtBuscarNotificacion");

  if (!input) return;

  const texto = normalizarTexto(input.value);

  if (!texto) {
    pintarNotificaciones(notificacionesGlobal);
    return;
  }

  const filtradas = notificacionesGlobal.filter(notificacion => {
    const estado = notificacion.leida ? "leída" : "no leída";

    return (
      normalizarTexto(notificacion.tipo).includes(texto) ||
      normalizarTexto(notificacion.titulo).includes(texto) ||
      normalizarTexto(notificacion.libro).includes(texto) ||
      normalizarTexto(notificacion.usuario).includes(texto) ||
      normalizarTexto(estado).includes(texto)
    );
  });

  pintarNotificaciones(filtradas);
}
