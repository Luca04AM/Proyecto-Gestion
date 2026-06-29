$(document).ready(function () {

    const API = "http://localhost/Proyecto-Gestion/backend/api/autores.php";

    //==============================
    // OBTENER ID DE LA URL
    //==============================

    const parametros = new URLSearchParams(window.location.search);

    const id = parametros.get("id");

    if (id == null) {

        alert("No se recibió el ID del autor.");

        window.location.href = "autores.html";

        return;

    }

    cargarAutor(id);

    //==============================
    // CARGAR AUTOR
    //==============================

    function cargarAutor(id) {

        $.ajax({

            url: API + "?id=" + id,

            method: "GET",

            dataType: "json",

            success: function (respuesta) {

                if (respuesta.success) {

                    let autor = respuesta.data;

                    $("#fotoAutor").attr(
                        "src",
                        "../img/autores/" + autor.fotografia
                    );

                    $("#fotoAutor").attr(
                        "alt",
                        autor.nombre
                    );

                    $("#nombreAutor").text(
                        autor.nombre
                    );

                    $("#nacionalidadAutor").text(
                        autor.nacionalidad
                    );

                    $("#fechaAutor").text(
                        autor.fecha_nacimiento
                    );

                    $("#estadoAutor").text(
                        autor.estado
                    );

                    $("#biografiaAutor").text(
                        autor.biografia
                    );

                } else {

                    alert(respuesta.message);

                    window.location.href = "autores.html";

                }

            },

            error: function () {

                alert("No fue posible conectar con el servidor.");

                window.location.href = "autores.html";

            }

        });

    }

});