$(document).ready(function () {

    const API = "http://localhost/Proyecto-Gestion/backend/api/autores.php";

    listarAutores();

    $("#formAutor").submit(function (e) {

        e.preventDefault();

        guardarAutor();

    });

    $("#txtBuscar").keyup(function () {

        buscarAutor();

    });

    $("#txtFotografia").change(function () {

        let archivo = this.files[0];

        if (archivo) {

            let lector = new FileReader();

            lector.onload = function (e) {

                $("#previewFoto").attr("src", e.target.result);

            };

            lector.readAsDataURL(archivo);

            $("#nombreFoto").text(archivo.name);

        }

    });

    


    $(document).on("click", ".btnInfo", function () {

    let id = $(this).data("id");

    window.location.href = "detalleAutor.html?id=" + id;

});

    //============================
// GUARDAR
//============================

function guardarAutor() {

    let formData = new FormData();

    formData.append("id", $("#txtId").val());
    formData.append("nombre", $("#txtNombre").val().trim());
    formData.append("nacionalidad", $("#txtNacionalidad").val().trim());
    formData.append("fecha_nacimiento", $("#txtFechaNacimiento").val());
    formData.append("biografia", $("#txtBiografia").val().trim());
    formData.append("estado", $("#txtEstado").val());

    // Imagen seleccionada
    let archivo = $("#txtFotografia")[0].files[0];

    if (archivo != undefined) {

        formData.append("fotografia", archivo);

    }

    if ($("#txtNombre").val().trim() == "") {

        mostrarAlerta("Ingrese el nombre.", "danger");

        return;

    }

    // Si tiene ID, es editar
    if ($("#txtId").val() != "") {

        formData.append("accion", "editar");

    } else {

        formData.append("accion", "guardar");

    }

    $.ajax({

        url: API,

        method: "POST",

        data: formData,

        processData: false,

        contentType: false,

        dataType: "json",

        success: function (respuesta) {

            if (respuesta.success) {

                mostrarAlerta(respuesta.message, "success");

                limpiarFormulario();

                listarAutores();

            } else {

                mostrarAlerta(respuesta.message, "danger");

            }

        },

        error: function () {

            mostrarAlerta("Error al conectar con el servidor.", "danger");

        }

    });

    }

//============================
// LISTAR AUTORES
//============================

function listarAutores() {

    $.ajax({

        url: API,

        method: "GET",

        dataType: "json",

        success: function (respuesta) {

            let filas = "";

            if (respuesta.success) {

                $.each(respuesta.data, function (i, autor) {

                    filas += `
                    <tr>

                        <td>${autor.id}</td>

                        <td>
                            <img
                                src="../img/autores/${autor.fotografia}"
                                class="tabla-imagen"
                                width="60">
                        </td>

                        <td>${autor.nombre}</td>

                        <td>${autor.nacionalidad}</td>

                       <td>${autor.fecha_nacimiento}</td>

                       

                        <td>

                            <span class="badge badge-disponible">
                                ${autor.estado}
                            </span>

                        </td>

                        <td>

                            <button
                                class="btn btn-editar btnEditar"

                                data-id="${autor.id}"
                                data-nombre="${autor.nombre}"
                                data-nacionalidad="${autor.nacionalidad}"
                                data-fecha="${autor.fecha_nacimiento}"
                                data-biografia="${autor.biografia}"
                                data-fotografia="${autor.fotografia}"
                                data-estado="${autor.estado}">

                                Editar

                            </button>

                            <button
                                class="btn btn-accent btnEliminar"
                                data-id="${autor.id}">
 
                                Eliminar

                            </button>

                            </button>

                         <button
                            class="btn btn-secondary btnInfo"
                            data-id="${autor.id}">

                            Información

                        </button>
                        </td>

                    </tr>
                    `;

                });

            }

            $("#tablaAutores").html(filas);

        },

        error: function () {

            mostrarAlerta("No se pudieron cargar los autores.", "danger");

        }

    });

}

//============================
// EDITAR AUTOR
//============================

$(document).on("click", ".btnEditar", function () {

    $("#txtId").val($(this).data("id"));
    $("#txtNombre").val($(this).data("nombre"));
    $("#txtNacionalidad").val($(this).data("nacionalidad"));
    $("#txtFechaNacimiento").val($(this).data("fecha"));
    $("#txtBiografia").val($(this).data("biografia"));
    $("#previewFoto").attr(
    "src",
    "../img/autores/" + $(this).data("fotografia")
    );
    $("#nombreFoto").text($(this).data("fotografia"));
    $("#txtEstado").val($(this).data("estado"));

    $("html, body").animate({
        scrollTop: 0
    }, 500);

});


//============================
// ELIMINAR AUTOR
//============================

$(document).on("click", ".btnEliminar", function () {

    let id = $(this).data("id");

    if (!confirm("¿Desea eliminar este autor?")) {

        return;

    }

    $.ajax({

        url: API,

        method: "DELETE",

        contentType: "application/json",

        dataType: "json",

        data: JSON.stringify({
            id: id
        }),

        success: function (respuesta) {

            if (respuesta.success) {

                mostrarAlerta(respuesta.message, "success");

                listarAutores();

            } else {

                mostrarAlerta(respuesta.message, "danger");

            }

        },

        error: function () {

            mostrarAlerta("No fue posible eliminar el autor.", "danger");

        }

    });

});


//============================
// BUSCAR
//============================

function buscarAutor() {

    let texto = $("#txtBuscar").val().toLowerCase();

    $("#tablaAutores tr").each(function () {

        let nombre = $(this).find("td:eq(2)").text().toLowerCase();

        $(this).toggle(nombre.indexOf(texto) > -1);

    });

}



//============================
// LIMPIAR FORMULARIO
//============================
function limpiarFormulario() {

    // Limpiar todos los controles del formulario
    $("#formAutor")[0].reset();

    // Quitar el ID para salir del modo edición
    $("#txtId").val("");

    // Limpiar el input file
    $("#txtFotografia").val("");

    // Volver a mostrar el icono de subir
    $("#previewFoto").attr(
        "src",
        "../img/autores/subir.png"
    );

    // Restaurar el texto
    $("#nombreFoto").text("Ningún archivo seleccionado");

}


//============================
// MOSTRAR ALERTAS
//============================

function mostrarAlerta(mensaje, tipo) {

    $("#alertaAutor").html(`
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">

            ${mensaje}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>
    `);

}



});

  