$(document).ready(function () {

    const API_LOGIN = "http://localhost/Proyecto-Gestion/backend/api/login.php";

    $("#formLogin").on("submit", function (e) {
        e.preventDefault();

        let correo = $("#correo").val().trim();
        let password = $("#password").val().trim();

        $("#alertaLogin").html("");

        if (correo === "" || password === "") {
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

        $.ajax({
            url: API_LOGIN,
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                correo: correo,
                password: password
            }),

            beforeSend: function () {
                $("#btnLogin").prop("disabled", true);
                $("#btnLogin").text("Ingresando...");
            },

            success: function (respuesta) {
                console.log(respuesta);

                if (respuesta.success === true) {
                    mostrarAlerta(respuesta.message, "success");

                    localStorage.setItem("sesion_activa", "true");
                    localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));

                    setTimeout(function () {
                        window.location.href = "../index.html";
                    }, 1000);

                } else {
                    mostrarAlerta(respuesta.message, "danger");
                }
            },

            error: function (xhr) {
                console.log(xhr.responseText);
                mostrarAlerta("Error al conectar con el servidor.", "danger");
            },

            complete: function () {
                $("#btnLogin").prop("disabled", false);
                $("#btnLogin").text("Iniciar Sesión");
            }
        });
    });

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaLogin").html(`
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