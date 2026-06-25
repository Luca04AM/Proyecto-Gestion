class Autor {
    constructor(id_autor, nombre, apellido, nacionalidad, fecha_nacimiento, estado) {
        this._id_autor = id_autor;
        this._nombre = nombre;
        this._apellido = apellido;
        this._nacionalidad = nacionalidad;
        this._fecha_nacimiento = fecha_nacimiento;
        this._estado = estado;
    }

    get id_autor() {
        return this._id_autor;
    }

    get nombre() {
        return this._nombre;
    }

    get apellido() {
        return this._apellido;
    }

    get nacionalidad() {
        return this._nacionalidad;
    }

    get fecha_nacimiento() {
        return this._fecha_nacimiento;
    }

    get estado() {
        return this._estado;
    }

    set id_autor(id_autor) {
        this._id_autor = id_autor;
    }

    set nombre(nombre) {
        this._nombre = nombre;
    }

    set apellido(apellido) {
        this._apellido = apellido;
    }

    set nacionalidad(nacionalidad) {
        this._nacionalidad = nacionalidad;
    }

    set fecha_nacimiento(fecha_nacimiento) {
        this._fecha_nacimiento = fecha_nacimiento;
    }

    set estado(estado) {
        this._estado = estado;
    }
}

export default Autor;
