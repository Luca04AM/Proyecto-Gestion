# API de SIGAB Libros

## Preparación local

1. Inicie Apache y MySQL desde XAMPP.
2. La conexión usa MySQL en el puerto `3306` de forma predeterminada. Puede cambiarla con `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.
3. Ejecute el contenido de `Mysql.txt` en phpMyAdmin o en el cliente de MySQL.
4. Abra el proyecto mediante `http://localhost/Proyecto-Gestion/frontend/`.

## Endpoints CRUD

- `api/generos.php`: GET, POST, PUT y DELETE.
- `api/portadas.php`: GET, POST y DELETE. Las actualizaciones se envían por POST con `accion=editar` para admitir archivos.
- `api/reportes.php`: GET, POST, PUT y DELETE.

Las respuestas usan JSON con la forma `{ "success": true|false, "message": "...", "data": ... }`.
