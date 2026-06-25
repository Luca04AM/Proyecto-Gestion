class Prestamo {
    constructor(id_prestamo, id_usuario, id_libro, fecha_prestamo, fecha_devolucion_estimada, fecha_devolucion_real, estado_prestamo) {
        this._id_prestamo = id_prestamo;
        this._id_usuario = id_usuario;
        this._id_libro = id_libro;
        this._fecha_prestamo = fecha_prestamo;
        this._fecha_devolucion_estimada = fecha_devolucion_estimada;
        this._fecha_devolucion_real = fecha_devolucion_real;
        this._estado_prestamo = estado_prestamo;
    }

    get id_prestamo() {
        return this._id_prestamo;
    }

    get id_usuario() {
        return this._id_usuario;
    }

    get id_libro() {
        return this._id_libro;
    }

    get fecha_prestamo() {
        return this._fecha_prestamo;
    }

    get fecha_devolucion_estimada() {
        return this._fecha_devolucion_estimada;
    }

    get fecha_devolucion_real() {
        return this._fecha_devolucion_real;
    }

    get estado_prestamo() {
        return this._estado_prestamo;
    }

    set id_prestamo(id_prestamo) {
        this._id_prestamo = id_prestamo;
    }

    set id_usuario(id_usuario) {
        this._id_usuario = id_usuario;
    }

    set id_libro(id_libro) {
        this._id_libro = id_libro;
    }

    set fecha_prestamo(fecha_prestamo) {
        this._fecha_prestamo = fecha_prestamo;
    }

    set fecha_devolucion_estimada(fecha_devolucion_estimada) {
        this._fecha_devolucion_estimada = fecha_devolucion_estimada;
    }

    set fecha_devolucion_real(fecha_devolucion_real) {
        this._fecha_devolucion_real = fecha_devolucion_real;
    }

    set estado_prestamo(estado_prestamo) {
        this._estado_prestamo = estado_prestamo;
    }
}

export default Prestamo;
