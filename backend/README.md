# API de SIGAB Libros

## Preparación local

1. Inicie Apache y MySQL desde XAMPP.
2. La conexión actual usa MySQL en el puerto `3307`, según `config/database.php`.
3. Ejecute el contenido de `Mysql.txt` en phpMyAdmin o en el cliente de MySQL.
4. Abra el proyecto mediante `http://localhost/Proyecto-Gestion/frontend/`.

## Endpoints CRUD

- `api/generos.php`: GET, POST, PUT y DELETE.
- `api/portadas.php`: GET, POST y DELETE. Las actualizaciones se envían por POST con `accion=editar` para admitir archivos.
- `api/reportes.php`: GET, POST, PUT y DELETE. `GET` con `accion=datos` genera resultados reales de préstamos, devoluciones o multas por rango de fechas.

## Integridad entre módulos

- Al renombrar un género se actualiza el valor correspondiente en los libros.
- No se puede eliminar un género utilizado por un libro.
- La portada predeterminada se sincroniza con el campo `portada` del libro.
- El reporte de devoluciones calcula los días de atraso comparando la fecha límite y la fecha devuelta.

Las respuestas usan JSON con la forma `{ "success": true|false, "message": "...", "data": ... }`.
