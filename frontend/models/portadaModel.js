class Portada {
    constructor(id_portada, id_libro, nombre_archivo, ruta_archivo, formato, tamano_archivo, fecha_carga, fecha_actualizacion, es_predeterminada, estado) {
        this._id_portada = id_portada;
        this._id_libro = id_libro;
        this._nombre_archivo = nombre_archivo;
        this._ruta_archivo = ruta_archivo;
        this._formato = formato;
        this._tamano_archivo = tamano_archivo;
        this._fecha_carga = fecha_carga;
        this._fecha_actualizacion = fecha_actualizacion;
        this._es_predeterminada = es_predeterminada;
        this._estado = estado;
    }

    get id_portada() {
        return this._id_portada;
    }

    get id_libro() {
        return this._id_libro;
    }

    get nombre_archivo() {
        return this._nombre_archivo;
    }

    get ruta_archivo() {
        return this._ruta_archivo;
    }

    get formato() {
        return this._formato;
    }

    get tamano_archivo() {
        return this._tamano_archivo;
    }

    get fecha_carga() {
        return this._fecha_carga;
    }

    get fecha_actualizacion() {
        return this._fecha_actualizacion;
    }

    get es_predeterminada() {
        return this._es_predeterminada;
    }

    get estado() {
        return this._estado;
    }

    set id_portada(id_portada) {
        this._id_portada = id_portada;
    }

    set id_libro(id_libro) {
        this._id_libro = id_libro;
    }

    set nombre_archivo(nombre_archivo) {
        this._nombre_archivo = nombre_archivo;
    }

    set ruta_archivo(ruta_archivo) {
        this._ruta_archivo = ruta_archivo;
    }

    set formato(formato) {
        this._formato = formato;
    }

    set tamano_archivo(tamano_archivo) {
        this._tamano_archivo = tamano_archivo;
    }

    set fecha_carga(fecha_carga) {
        this._fecha_carga = fecha_carga;
    }

    set fecha_actualizacion(fecha_actualizacion) {
        this._fecha_actualizacion = fecha_actualizacion;
    }

    set es_predeterminada(es_predeterminada) {
        this._es_predeterminada = es_predeterminada;
    }

    set estado(estado) {
        this._estado = estado;
    }
}

export default Portada;
