class Busqueda {
    constructor(id_busqueda, id_usuario, termino_busqueda, criterio_busqueda, fecha_busqueda) {
        this._id_busqueda = id_busqueda;
        this._id_usuario = id_usuario;
        this._termino_busqueda = termino_busqueda;
        this._criterio_busqueda = criterio_busqueda;
        this._fecha_busqueda = fecha_busqueda;
    }

    get id_busqueda() {
        return this._id_busqueda;
    }

    get id_usuario() {
        return this._id_usuario;
    }

    get termino_busqueda() {
        return this._termino_busqueda;
    }

    get criterio_busqueda() {
        return this._criterio_busqueda;
    }

    get fecha_busqueda() {
        return this._fecha_busqueda;
    }

    set id_busqueda(id_busqueda) {
        this._id_busqueda = id_busqueda;
    }

    set id_usuario(id_usuario) {
        this._id_usuario = id_usuario;
    }

    set termino_busqueda(termino_busqueda) {
        this._termino_busqueda = termino_busqueda;
    }

    set criterio_busqueda(criterio_busqueda) {
        this._criterio_busqueda = criterio_busqueda;
    }

    set fecha_busqueda(fecha_busqueda) {
        this._fecha_busqueda = fecha_busqueda;
    }
}

export default Busqueda;
