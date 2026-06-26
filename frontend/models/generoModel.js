class Genero {
    constructor(id_genero, nombre, descripcion, estado) {
        this._id_genero = id_genero;
        this._nombre = nombre;
        this._descripcion = descripcion;
        this._estado = estado;
    }

    get id_genero() {
        return this._id_genero;
    }

    get nombre() {
        return this._nombre;
    }

    get descripcion() {
        return this._descripcion;
    }

    get estado() {
        return this._estado;
    }

    set id_genero(id_genero) {
        this._id_genero = id_genero;
    }

    set nombre(nombre) {
        this._nombre = nombre;
    }

    set descripcion(descripcion) {
        this._descripcion = descripcion;
    }

    set estado(estado) {
        this._estado = estado;
    }
}

export default Genero;
