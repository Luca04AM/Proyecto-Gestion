class Reporte {
    constructor(id_reporte, id_usuario, tipo_reporte, fecha_generacion, fecha_inicio, fecha_fin, estado) {
        this._id_reporte = id_reporte;
        this._id_usuario = id_usuario;
        this._tipo_reporte = tipo_reporte;
        this._fecha_generacion = fecha_generacion;
        this._fecha_inicio = fecha_inicio;
        this._fecha_fin = fecha_fin;
        this._estado = estado;
    }

    get id_reporte() {
        return this._id_reporte;
    }

    get id_usuario() {
        return this._id_usuario;
    }

    get tipo_reporte() {
        return this._tipo_reporte;
    }

    get fecha_generacion() {
        return this._fecha_generacion;
    }

    get fecha_inicio() {
        return this._fecha_inicio;
    }

    get fecha_fin() {
        return this._fecha_fin;
    }

    get estado() {
        return this._estado;
    }

    set id_reporte(id_reporte) {
        this._id_reporte = id_reporte;
    }

    set id_usuario(id_usuario) {
        this._id_usuario = id_usuario;
    }

    set tipo_reporte(tipo_reporte) {
        this._tipo_reporte = tipo_reporte;
    }

    set fecha_generacion(fecha_generacion) {
        this._fecha_generacion = fecha_generacion;
    }

    set fecha_inicio(fecha_inicio) {
        this._fecha_inicio = fecha_inicio;
    }

    set fecha_fin(fecha_fin) {
        this._fecha_fin = fecha_fin;
    }

    set estado(estado) {
        this._estado = estado;
    }
}

export default Reporte;
