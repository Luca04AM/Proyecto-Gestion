$(document).ready(function () {

    const parametros = new URLSearchParams(window.location.search);
    const idLibro = parametros.get("id");
    const modoEdicion = idLibro !== null;

    cargarOpcionesFormulario().then(function () {
        if (modoEdicion) {
            prepararFormularioEdicion(idLibro);
        }
    });

    $("#portadaSelect").on("change", function () {
        actualizarVistaPreviaPortada();
    });

    $("#previewPortada").on("error", function () {
        $(this).attr("src", "../img/autores/subir.png");
    });

    $("#formLibro").on("submit", function (e) {
        e.preventDefault();

        const libro = {
            titulo: ($("#titulo").val() || "").trim(),
            autor: ($("#autor").val() || "").trim(),
            genero: ($("#genero").val() || "").trim(),
            descripcion: ($("#descripcion").val() || "").trim(),
            portada: ($("#portada").val() || "").trim(),
            estado: $("#estado").val(),
            condicion: $("#condicion").val()
        };

        if (modoEdicion) {
            libro.id = $("#idLibro").val();
        }

        if (
            libro.titulo === "" ||
            libro.autor === "" ||
            libro.genero === "" ||
            libro.descripcion === "" ||
            libro.condicion === ""
        ) {
            mostrarMensaje("Debe completar todos los campos obligatorios.", "error");
            return;
        }

        const metodo = modoEdicion ? "PUT" : "POST";

        $.ajax({
            url: "../../backend/api/libros.php",
            type: metodo,
            contentType: "application/json",
            data: JSON.stringify(libro),
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    mostrarMensaje(respuesta.message, "exito");

                    if (!modoEdicion) {
                        limpiarFormulario();
                    }
                } else {
                    mostrarMensaje(respuesta.message, "error");
                }
            },
            error: function (xhr) {
                let mensaje = "No se pudo guardar la información del libro.";

                if (xhr.responseJSON && xhr.responseJSON.message) {
                    mensaje = xhr.responseJSON.message;
                }

                mostrarMensaje(mensaje, "error");
            }
        });
    });

    $("#btnLimpiarFormulario").on("click", function () {
        limpiarFormulario();
        $("#mensajeFormulario").hide();
    });

    function cargarOpcionesFormulario() {
        const promesaOpciones = $.ajax({
            url: "../../backend/api/opcionesLibro.php",
            type: "GET",
            dataType: "json"
        });

        const promesaPortadas = $.ajax({
            url: "../../backend/api/portadas.php",
            type: "GET",
            dataType: "json"
        });

        return $.when(promesaOpciones, promesaPortadas)
            .done(function (respuestaOpciones, respuestaPortadas) {
                const opciones = respuestaOpciones[0];
                const portadas = respuestaPortadas[0];

                if (opciones.success) {
                    cargarAutores(opciones.autores);
                    cargarGeneros(opciones.generos);
                } else {
                    mostrarMensaje("No se pudieron cargar autores y géneros.", "error");
                }

                if (portadas.success) {
                    cargarPortadas(portadas.data || []);
                } else {
                    mostrarMensaje("No se pudieron cargar las portadas.", "error");
                }
            })
            .fail(function () {
                mostrarMensaje("Error al cargar opciones del formulario.", "error");
            });
    }

    function cargarAutores(autores) {
        const selectAutor = $("#autor");

        selectAutor.empty();
        selectAutor.append(`<option value="">Seleccione un autor</option>`);

        autores.forEach(function (autor) {
            selectAutor.append(`
                <option value="${autor.nombre}">
                    ${autor.nombre}
                </option>
            `);
        });
    }

    function cargarGeneros(generos) {
        const selectGenero = $("#genero");

        selectGenero.empty();
        selectGenero.append(`<option value="">Seleccione un género</option>`);

        generos.forEach(function (genero) {
            selectGenero.append(`
                <option value="${genero.nombre}">
                    ${genero.nombre}
                </option>
            `);
        });
    }

    function cargarPortadas(portadas) {
        const selectPortada = $("#portadaSelect");

        selectPortada.empty();
        selectPortada.append(`<option value="">Seleccione una portada</option>`);

        portadas.forEach(function (portada) {
            if (portada.estado && portada.estado !== "Activo") {
                return;
            }

            selectPortada.append(`
                <option value="${portada.nombre_archivo}" data-ruta="${portada.ruta_archivo}">
                    ${portada.libro} - ${portada.nombre_archivo}
                </option>
            `);
        });

        actualizarVistaPreviaPortada();
    }

    function prepararFormularioEdicion(id) {
        $("#tituloFormulario").text("Editar Libro");
        $("#subtituloFormulario").text("Modifique la información del libro seleccionado.");
        $("#btnGuardar").text("Guardar cambios");

        $.ajax({
            url: "../../backend/api/libros.php?id=" + encodeURIComponent(id),
            type: "GET",
            dataType: "json",
            success: function (respuesta) {
                if (respuesta.success) {
                    cargarDatosFormulario(respuesta.data);
                } else {
                    mostrarMensaje("El libro no existe.", "error");
                }
            },
            error: function () {
                mostrarMensaje("No se pudo cargar la información del libro.", "error");
            }
        });
    }

    function cargarDatosFormulario(libro) {
        $("#idLibro").val(libro.id);
        $("#titulo").val(libro.titulo);
        $("#autor").val(libro.autor);
        $("#genero").val(libro.genero);
        $("#descripcion").val(libro.descripcion);
        $("#portada").val(libro.portada || "");
        $("#portadaSelect").val(libro.portada || "");
        $("#estado").val(libro.estado);
        $("#condicion").val(libro.condicion || "Excelente");
        actualizarVistaPreviaPortada();
    }

    function limpiarFormulario() {
        $("#idLibro").val("");
        $("#titulo").val("");
        $("#autor").val("");
        $("#genero").val("");
        $("#descripcion").val("");
        $("#portada").val("");
        $("#portadaSelect").val("");
        $("#estado").val("Disponible");
        $("#condicion").val("Excelente");
        actualizarVistaPreviaPortada();
    }

    function actualizarVistaPreviaPortada() {
        const select = $("#portadaSelect");
        const opcionSeleccionada = select.find("option:selected");
        const portada = opcionSeleccionada.val() || "";
        const ruta = opcionSeleccionada.data("ruta") || "";

        $("#portada").val(portada);

        if (portada && ruta) {
            $("#previewPortada").attr("src", ruta);
            $("#textoPortada").text(opcionSeleccionada.text());
            return;
        }

        $("#previewPortada").attr("src", "../img/autores/subir.png");
        $("#textoPortada").text("Ninguna portada seleccionada");
    }

    function mostrarMensaje(texto, tipo) {
        const mensaje = $("#mensajeFormulario");

        mensaje.removeClass("mensaje-exito mensaje-error");

        if (tipo === "exito") {
            mensaje.addClass("mensaje-exito");
        } else {
            mensaje.addClass("mensaje-error");
        }

        mensaje.text(texto);
        mensaje.attr("style", "display:block;");
    }

});
