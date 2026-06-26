class HistorialPrestamo {
    constructor(id_historial, id_prestamo, fecha_registro, accion_realizada, estado_anterior, estado_nuevo, observacion) {
        this._id_historial = id_historial;
        this._id_prestamo = id_prestamo;
        this._fecha_registro = fecha_registro;
        this._accion_realizada = accion_realizada;
        this._estado_anterior = estado_anterior;
        this._estado_nuevo = estado_nuevo;
        this._observacion = observacion;
    }

    get id_historial() {
        return this._id_historial;
    }

    get id_prestamo() {
        return this._id_prestamo;
    }

    get fecha_registro() {
        return this._fecha_registro;
    }

    get accion_realizada() {
        return this._accion_realizada;
    }

    get estado_anterior() {
        return this._estado_anterior;
    }

    get estado_nuevo() {
        return this._estado_nuevo;
    }

    get observacion() {
        return this._observacion;
    }

    set id_historial(id_historial) {
        this._id_historial = id_historial;
    }

    set id_prestamo(id_prestamo) {
        this._id_prestamo = id_prestamo;
    }

    set fecha_registro(fecha_registro) {
        this._fecha_registro = fecha_registro;
    }

    set accion_realizada(accion_realizada) {
        this._accion_realizada = accion_realizada;
    }

    set estado_anterior(estado_anterior) {
        this._estado_anterior = estado_anterior;
    }

    set estado_nuevo(estado_nuevo) {
        this._estado_nuevo = estado_nuevo;
    }

    set observacion(observacion) {
        this._observacion = observacion;
    }
}

export default HistorialPrestamo;
