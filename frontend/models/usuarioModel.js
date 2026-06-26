class Usuario {
    constructor(id_usuario, nombre, correo, telefono, rol, estado) {
        this._id_usuario = id_usuario;
        this._nombre = nombre;
        this._correo = correo;
        this._telefono = telefono;
        this._rol = rol;
        this._estado = estado;
    }

    get id_usuario() {
        return this._id_usuario;
    }

    get nombre() {
        return this._nombre;
    }

    get correo() {
        return this._correo;
    }

    get telefono() {
        return this._telefono;
    }

    get rol() {
        return this._rol;
    }

    get estado() {
        return this._estado;
    }

    set id_usuario(id_usuario) {
        this._id_usuario = id_usuario;
    }

    set nombre(nombre) {
        this._nombre = nombre;
    }

    set correo(correo) {
        this._correo = correo;
    }

    set telefono(telefono) {
        this._telefono = telefono;
    }

    set rol(rol) {
        this._rol = rol;
    }

    set estado(estado) {
        this._estado = estado;
    }
}

export default Usuario;
