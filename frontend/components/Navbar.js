class Navbar extends HTMLElement {
    connectedCallback() {

        const estaEnViews = window.location.pathname.includes("/views/");
        const base = estaEnViews ? "../" : "";

        this.innerHTML = `
            <nav class="navbar">
                <div class="container menu-container">

                    <a href="${base}index.html" class="logo">
                        <div class="logo-circle">
                            <img src="${base}img/logo.png" alt="Logo">
                        </div>
                        <span>SIGAB Libros</span>
                    </a>

                    <ul class="menu">

                        <li>
                            <a href="${base}index.html">Inicio</a>
                        </li>

                        <li class="dropdown">
                            <a href="#">Mantenimiento</a>

                            <ul class="submenu">
                                <li><a href="${base}views/autores.html">Autores</a></li>
                                <li><a href="${base}views/genero.html">Géneros</a></li>
                                <li><a href="${base}views/portada.html">Portadas</a></li>
                                <li><a href="${base}views/usuario.html">Usuarios</a></li>
                            </ul>
                        </li>

                        <li class="dropdown">
                            <a href="#">Circulación</a>

                            <ul class="submenu">
                                <li><a href="${base}views/prestamo.html">Préstamos</a></li>
                                <li><a href="${base}views/devoluciones.html">Devoluciones</a></li>
                                <li><a href="${base}views/reservas.html">Reservas</a></li>
                                <li><a href="${base}views/multas.html">Multas</a></li>
                            </ul>
                        </li>

                        <li class="dropdown">
                            <a href="#">Consultas</a>

                            <ul class="submenu">
                                <li><a href="${base}views/catalogo.html">Catálogo</a></li>
                                <li><a href="${base}views/busqueda.html">Búsqueda</a></li>
                                <li><a href="${base}views/historial.html">Historial</a></li>
                            </ul>
                        </li>

                        <li class="dropdown">
                            <a href="#">Administración</a>

                            <ul class="submenu">
                                <li><a href="${base}views/notificaciones.html">Notificaciones</a></li>
                                <li><a href="${base}views/reportes.html">Reportes</a></li>
                                <li><a href="${base}views/panelAdministrador.html">Panel</a></li>
                                <li><a href="${base}views/autenticacion.html">Acceso</a></li>
                            </ul>
                        </li>

                    </ul>

                </div>
            </nav>
        `;
    }
}

customElements.define("nav-bar", Navbar);