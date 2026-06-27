$(document).ready(function () {

    const API_REGISTRO = "http://localhost/Proyecto-Gestion/backend/api/usuarios.php";

    $("#formRegistro").on("submit", function (e) {
        e.preventDefault();

        let nombre = $("#nombre").val().trim();
        let correo = $("#correo").val().trim();
        let password = $("#password").val().trim();
        let confirmarPassword = $("#confirmarPassword").val().trim();

        $("#alertaRegistro").html("");

        if (nombre === "" || correo === "" || password === "" || confirmarPassword === "") {
            mostrarAlerta("Todos los campos son obligatorios.", "danger");
            return;
        }

        if (!validarCorreo(correo)) {
            mostrarAlerta("Debe ingresar un correo válido.", "danger");
            return;
        }

        if (password.length < 6) {
            mostrarAlerta("La contraseña debe tener mínimo 6 caracteres.", "danger");
            return;
        }

        if (password !== confirmarPassword) {
            mostrarAlerta("Las contraseñas no coinciden.", "danger");
            return;
        }

        $.ajax({
            url: API_REGISTRO,
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                nombre: nombre,
                correo: correo,
                password: password
            }),

            beforeSend: function () {
                $("#btnRegistrar").prop("disabled", true);
                $("#btnRegistrar").text("Registrando...");
            },

            success: function (respuesta) {
                console.log(respuesta);

                if (respuesta.success === true) {
                    mostrarAlerta(respuesta.message, "success");
                    $("#formRegistro")[0].reset();

                    setTimeout(function () {
                        window.location.href = "login.html";
                    }, 1500);

                } else {
                    mostrarAlerta(respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("Error al conectar con el servidor.", "danger");
            },

            complete: function () {
                $("#btnRegistrar").prop("disabled", false);
                $("#btnRegistrar").text("Registrar Usuario");
            }
        });
    });

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaRegistro").html(`
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