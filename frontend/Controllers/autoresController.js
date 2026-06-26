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
    let foto = $("#txtFotografia").val();

    $("#previewFoto").attr("src", "../img/autores/" + foto);

    $("#nombreFoto").text(foto);


    $(document).on("click", ".btnInfo", function () {

    let id = $(this).data("id");

    window.location.href = "detalleAutor.html?id=" + id;

});

    //============================
// GUARDAR
//============================

function guardarAutor() {

    let autor = {

        id: $("#txtId").val(),

        nombre: $("#txtNombre").val().trim(),

        nacionalidad: $("#txtNacionalidad").val().trim(),

        fecha_nacimiento: $("#txtFechaNacimiento").val(),

        biografia: $("#txtBiografia").val().trim(),

        fotografia: $("#txtFotografia").val(),

        estado: $("#txtEstado").val()

    };

    if (autor.nombre == "") {

        mostrarAlerta("Ingrese el nombre.", "danger");

        return;

    }

    let metodo = "POST";

    if (autor.id != "") {

        metodo = "PUT";

    }

    $.ajax({

        url: API,

        method: metodo,

        contentType: "application/json",

        dataType: "json",

        data: JSON.stringify(autor),

        success: function (respuesta) {

            if (respuesta.success) {

                mostrarAlerta(respuesta.message, "success");

                limpiarFormulario();

                listarAutores();

            }

            else{

                mostrarAlerta(respuesta.message,"danger");

            }

        },

        error:function(){

            mostrarAlerta("Error al conectar.","danger");

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
    $("#txtFotografia").change(function () {

    let foto = $(this).val();

    $("#previewFoto").attr("src", "../img/autores/" + foto);

    $("#nombreFoto").text(foto);

});

    $("#nombreFoto").text($(this).data("fotografia"));

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
// CAMBIAR FOTO
//============================

$("#txtFotografia").change(function () {

    let foto = $(this).val();

    $("#previewFoto").attr("src", "../img/autores/" + foto);

    $("#nombreFoto").text(foto);

});

//============================
// LIMPIAR FORMULARIO
//============================

function limpiarFormulario() {

    $("#formAutor")[0].reset();

    $("#txtId").val("");

    $("#txtFotografia").val("default.jpg");

    $("#previewFoto").attr("src", "../img/autores/default.jpg");

    $("#nombreFoto").text("default.jpg");

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

  