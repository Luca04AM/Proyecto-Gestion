class Catalogo {
    constructor(id_libro, titulo, isbn, editorial, anio_publicacion, descripcion, estado) {
        this._id_libro = id_libro;
        this._titulo = titulo;
        this._isbn = isbn;
        this._editorial = editorial;
        this._anio_publicacion = anio_publicacion;
        this._descripcion = descripcion;
        this._estado = estado;
    }

    get id_libro() {
        return this._id_libro;
    }

    get titulo() {
        return this._titulo;
    }

    get isbn() {
        return this._isbn;
    }

    get editorial() {
        return this._editorial;
    }

    get anio_publicacion() {
        return this._anio_publicacion;
    }

    get descripcion() {
        return this._descripcion;
    }

    get estado() {
        return this._estado;
    }

    set id_libro(id_libro) {
        this._id_libro = id_libro;
    }

    set titulo(titulo) {
        this._titulo = titulo;
    }

    set isbn(isbn) {
        this._isbn = isbn;
    }

    set editorial(editorial) {
        this._editorial = editorial;
    }

    set anio_publicacion(anio_publicacion) {
        this._anio_publicacion = anio_publicacion;
    }

    set descripcion(descripcion) {
        this._descripcion = descripcion;
    }

    set estado(estado) {
        this._estado = estado;
    }
}

export default Catalogo;
