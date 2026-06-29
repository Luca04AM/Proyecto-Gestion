$(document).ready(function () {

    const API_USUARIOS = "http://localhost/Proyecto-Gestion/backend/api/usuarios.php";

    let usuarios = [];

    cargarUsuarios();

    /* ==========================
       REGISTRAR USUARIO
    ========================== */

    $("#formRegistro").on("submit", function (e) {
        e.preventDefault();

        let nombre = $("#nombreRegistro").val().trim();
        let correo = $("#correoRegistro").val().trim();
        let password = $("#passwordRegistro").val().trim();
        let confirmar = $("#confirmarRegistro").val().trim();

        $("#msgRegistro").html("");

        if (nombre === "" || correo === "" || password === "" || confirmar === "") {
            mostrarAlerta("#msgRegistro", "Todos los campos son obligatorios.", "danger");
            return;
        }

        if (!correoValido(correo)) {
            mostrarAlerta("#msgRegistro", "Debe ingresar un correo válido.", "danger");
            return;
        }

        if (password.length < 6) {
            mostrarAlerta("#msgRegistro", "La contraseña debe tener mínimo 6 caracteres.", "danger");
            return;
        }

        if (password !== confirmar) {
            mostrarAlerta("#msgRegistro", "Las contraseñas no coinciden.", "danger");
            return;
        }

        $.ajax({
            url: API_USUARIOS,
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                nombre: nombre,
                correo: correo,
                password: password
            }),

            beforeSend: function () {
                $("#btnRegistrarUsuario").prop("disabled", true).text("Registrando...");
            },

            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarAlerta("#msgRegistro", respuesta.message, "success");
                    $("#formRegistro")[0].reset();
                    cargarUsuarios();
                } else {
                    mostrarAlerta("#msgRegistro", respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("#msgRegistro", "Error al conectar con el servidor.", "danger");
            },

            complete: function () {
                $("#btnRegistrarUsuario").prop("disabled", false).text("Registrar usuario");
            }
        });
    });

    /* ==========================
       BUSCAR Y FILTRAR
    ========================== */

    $("#buscarUsuario, #filtroEstado").on("input change", function () {
        pintarTabla();
    });

    /* ==========================
       EDITAR USUARIO
    ========================== */

    $("#formEditarUsuario").on("submit", function (e) {
        e.preventDefault();

        let id = $("#editarId").val();
        let nombre = $("#editarNombre").val().trim();
        let correo = $("#editarCorreo").val().trim();
        let estado = $("#editarEstado").val();

        $("#msgGestion").html("");

        if (id === "" || nombre === "" || correo === "" || estado === "") {
            mostrarAlerta("#msgGestion", "Todos los campos son obligatorios.", "danger");
            return;
        }

        if (!correoValido(correo)) {
            mostrarAlerta("#msgGestion", "Debe ingresar un correo válido.", "danger");
            return;
        }

        $.ajax({
            url: API_USUARIOS,
            method: "PUT",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                accion: "editar",
                id: id,
                nombre: nombre,
                correo: correo,
                estado: estado
            }),

            beforeSend: function () {
                $("#btnGuardarEdicion").prop("disabled", true).text("Guardando...");
            },

            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarAlerta("#msgGestion", respuesta.message, "success");
                    $("#cardEditarUsuario").addClass("d-none");
                    $("#formEditarUsuario")[0].reset();
                    cargarUsuarios();
                } else {
                    mostrarAlerta("#msgGestion", respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("#msgGestion", "Error al conectar con el servidor.", "danger");
            },

            complete: function () {
                $("#btnGuardarEdicion").prop("disabled", false).text("Guardar cambios");
            }
        });
    });

    $("#btnCancelarEdicion").on("click", function () {
        $("#cardEditarUsuario").addClass("d-none");
        $("#formEditarUsuario")[0].reset();
    });

    /* ==========================
       CAMBIAR CONTRASEÑA
    ========================== */

    $("#formPassword").on("submit", function (e) {
        e.preventDefault();

        let id = $("#usuarioPassword").val();
        let passwordActual = $("#passwordActual").val().trim();
        let passwordNueva = $("#passwordNueva").val().trim();
        let passwordConfirmar = $("#passwordConfirmar").val().trim();

        $("#msgPassword").html("");

        if (id === "" || passwordActual === "" || passwordNueva === "" || passwordConfirmar === "") {
            mostrarAlerta("#msgPassword", "Todos los campos son obligatorios.", "danger");
            return;
        }

        if (passwordNueva.length < 6) {
            mostrarAlerta("#msgPassword", "La nueva contraseña debe tener mínimo 6 caracteres.", "danger");
            return;
        }

        if (passwordNueva !== passwordConfirmar) {
            mostrarAlerta("#msgPassword", "Las contraseñas no coinciden.", "danger");
            return;
        }

        $.ajax({
            url: API_USUARIOS,
            method: "PUT",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                accion: "cambiarPassword",
                id: id,
                password_actual: passwordActual,
                password_nueva: passwordNueva
            }),

            beforeSend: function () {
                $("#btnCambiarPassword").prop("disabled", true).text("Guardando...");
            },

            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarAlerta("#msgPassword", respuesta.message, "success");
                    $("#formPassword")[0].reset();
                    cargarUsuarios();
                } else {
                    mostrarAlerta("#msgPassword", respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("#msgPassword", "Error al conectar con el servidor.", "danger");
            },

            complete: function () {
                $("#btnCambiarPassword").prop("disabled", false).text("Guardar cambios");
            }
        });
    });

    /* ==========================
       BOTÓN VER DETALLE
    ========================== */

    $(document).on("click", ".btn-detalle", function () {
        let id = $(this).data("id");
        let usuario = usuarios.find(u => u.id == id);

        if (!usuario) {
            mostrarAlerta("#msgGestion", "No se encontró el usuario.", "danger");
            return;
        }

        $("#detalleUsuario").html(`
            <div class="card">
                <div class="card-header">
                    Detalle del usuario
                </div>

                <div class="card-body">
                    <p><strong>ID:</strong> ${usuario.id}</p>
                    <p><strong>Nombre:</strong> ${usuario.nombre}</p>
                    <p><strong>Correo:</strong> ${usuario.correo}</p>
                    <p><strong>Estado:</strong> ${badgeEstado(usuario.estado)}</p>
                    <p><strong>Fecha de registro:</strong> ${formatearFecha(usuario.fecha_registro)}</p>
                </div>
            </div>
        `);
    });

    /* ==========================
       BOTÓN EDITAR
    ========================== */

    $(document).on("click", ".btn-editar", function () {
        let id = $(this).data("id");
        let usuario = usuarios.find(u => u.id == id);

        if (!usuario) {
            mostrarAlerta("#msgGestion", "No se encontró el usuario.", "danger");
            return;
        }

        $("#editarId").val(usuario.id);
        $("#editarNombre").val(usuario.nombre);
        $("#editarCorreo").val(usuario.correo);
        $("#editarEstado").val(usuario.estado);

        $("#cardEditarUsuario").removeClass("d-none");

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });
    });

    /* ==========================
       BOTÓN ACTIVAR / INACTIVAR
    ========================== */

    $(document).on("click", ".btn-estado", function () {
        let id = $(this).data("id");
        let estadoActual = $(this).data("estado");

        let nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";

        if (!confirm("¿Desea cambiar el estado del usuario a " + nuevoEstado + "?")) {
            return;
        }

        $.ajax({
            url: API_USUARIOS,
            method: "PUT",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                accion: "cambiarEstado",
                id: id,
                estado: nuevoEstado
            }),

            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarAlerta("#msgGestion", respuesta.message, "success");
                    cargarUsuarios();
                } else {
                    mostrarAlerta("#msgGestion", respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("#msgGestion", "Error al conectar con el servidor.", "danger");
            }
        });
    });

    /* ==========================
       CARGAR USUARIOS
    ========================== */

    function cargarUsuarios() {
        $.ajax({
            url: API_USUARIOS,
            method: "GET",
            dataType: "json",

            success: function (respuesta) {
                if (respuesta.success) {
                    usuarios = respuesta.data;
                    pintarTabla();
                    cargarSelectUsuarios();
                } else {
                    mostrarAlerta("#msgGestion", respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("#msgGestion", "Error al cargar usuarios.", "danger");
            }
        });
    }

    /* ==========================
       PINTAR TABLA
    ========================== */

    function pintarTabla() {
        let busqueda = ($("#buscarUsuario").val() || "").toLowerCase();
        let estadoFiltro = $("#filtroEstado").val() || "";

        let usuariosFiltrados = usuarios.filter(usuario => {
            let nombre = usuario.nombre ? usuario.nombre.toLowerCase() : "";
            let correo = usuario.correo ? usuario.correo.toLowerCase() : "";

            let coincideBusqueda =
                nombre.includes(busqueda) ||
                correo.includes(busqueda);

            let coincideEstado =
                estadoFiltro === "" || usuario.estado === estadoFiltro;

            return coincideBusqueda && coincideEstado;
        });

        let html = "";

        if (usuariosFiltrados.length === 0) {
            html = `
                <tr>
                    <td colspan="6" class="text-center">
                        No hay usuarios para mostrar.
                    </td>
                </tr>
            `;
        } else {
            usuariosFiltrados.forEach(usuario => {
                let textoBotonEstado = usuario.estado === "Activo" ? "Inactivar" : "Activar";
                let claseBotonEstado = usuario.estado === "Activo" ? "btn-warning" : "btn-success";

                html += `
                    <tr>
                        <td>${usuario.id}</td>
                        <td>${usuario.nombre}</td>
                        <td>${usuario.correo}</td>
                        <td>${badgeEstado(usuario.estado)}</td>
                        <td>${formatearFecha(usuario.fecha_registro)}</td>
                        <td>
                            <button class="btn btn-info btn-sm btn-detalle" data-id="${usuario.id}">
                                Ver
                            </button>

                            <button class="btn btn-primary btn-sm btn-editar" data-id="${usuario.id}">
                                Editar
                            </button>

                            <button class="btn ${claseBotonEstado} btn-sm btn-estado"
                                data-id="${usuario.id}"
                                data-estado="${usuario.estado}">
                                ${textoBotonEstado}
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        $("#tablaUsuarios").html(html);
    }

    /* ==========================
       CARGAR SELECT DE USUARIOS
    ========================== */

    function cargarSelectUsuarios() {
        let html = `<option value="">Seleccione un usuario</option>`;

        usuarios.forEach(usuario => {
            html += `
                <option value="${usuario.id}">
                    ${usuario.nombre} - ${usuario.correo}
                </option>
            `;
        });

        $("#usuarioPassword").html(html);
    }

    /* ==========================
       FUNCIONES AUXILIARES
    ========================== */

    function mostrarAlerta(contenedor, mensaje, tipo) {
        $(contenedor).html(`
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }

    function correoValido(correo) {
        let expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return expresion.test(correo);
    }

    function badgeEstado(estado) {
        if (estado === "Activo") {
            return `<span class="badge bg-success">Activo</span>`;
        }

        return `<span class="badge bg-secondary">Inactivo</span>`;
    }

    function formatearFecha(fecha) {
        if (!fecha) {
            return "Sin fecha";
        }

        let fechaObj = new Date(fecha);

        if (isNaN(fechaObj.getTime())) {
            return fecha;
        }

        return fechaObj.toLocaleString("es-CR");
    }

});