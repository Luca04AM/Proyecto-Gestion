$(document).ready(function () {

    const API_RECUPERAR = "http://localhost/Proyecto-Gestion/backend/api/recuperar.php";

    $("#formRecuperar").on("submit", function (e) {
        e.preventDefault();

        let correo = $("#correo").val().trim();

        $("#alertaRecuperar").html("");
        $("#tokenGenerado").html("");

        if (correo === "") {
            mostrarAlerta("El correo es obligatorio.", "danger");
            return;
        }

        if (!validarCorreo(correo)) {
            mostrarAlerta("Debe ingresar un correo válido.", "danger");
            return;
        }

        $.ajax({
            url: API_RECUPERAR,
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                correo: correo
            }),

            beforeSend: function () {
                $("#btnRecuperar").prop("disabled", true).text("Generando...");
            },

            success: function (respuesta) {
                console.log(respuesta);

                if (respuesta.success === true) {
                    mostrarAlerta(respuesta.message, "success");

                    if (respuesta.token) {
                        $("#tokenGenerado").html(`
                            <div class="alert alert-info mt-3">
                                <strong>Token generado:</strong><br>
                                <code>${respuesta.token}</code>
                            </div>
                        `);
                    }

                } else {
                    mostrarAlerta(respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("Error al conectar con el servidor.", "danger");
            },

            complete: function () {
                $("#btnRecuperar").prop("disabled", false).text("Generar Token");
            }
        });
    });

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaRecuperar").html(`
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }

    function validarCorreo(correo) {
        let expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return expresion.test(correo);
    }

});