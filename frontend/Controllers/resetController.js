$(document).ready(function () {

    const API_RESET = "http://localhost/Proyecto-Gestion/backend/api/reset.php";

    $("#formReset").on("submit", function (e) {
        e.preventDefault();

        let token = $("#token").val().trim();
        let password = $("#password").val().trim();
        let confirmarPassword = $("#confirmarPassword").val().trim();

        $("#alertaReset").html("");

        if (token === "" || password === "" || confirmarPassword === "") {
            mostrarAlerta("Todos los campos son obligatorios.", "danger");
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
            url: API_RESET,
            method: "PUT",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                token: token,
                password: password
            }),

            beforeSend: function () {
                $("#btnReset").prop("disabled", true).text("Cambiando...");
            },

            success: function (respuesta) {
                console.log(respuesta);

                if (respuesta.success === true) {
                    mostrarAlerta(respuesta.message, "success");
                    $("#formReset")[0].reset();

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
                $("#btnReset").prop("disabled", false).text("Cambiar Contraseña");
            }
        });
    });

    function mostrarAlerta(mensaje, tipo) {
        $("#alertaReset").html(`
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }

});