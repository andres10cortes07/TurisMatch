# API de Turismo IA

Base local: `http://localhost:3000`. El frontend está en `http://localhost:5173`.

## Reglas de acceso

- **Público:** búsqueda, consulta de sitios/categorías/planes, listado de calificaciones y catálogo de preferencias.
- **Con sesión:** perfil propio, favoritos, preferencias propias y publicar calificaciones.
- **Administrador:** crear/editar/eliminar sitios, categorías, planes y preferencias; listar usuarios. El alta pública siempre asigna rol `turista`.
- Las sesiones usan `express-session`, cookie `turismo_sid` HttpOnly y 30 minutos de expiración por inactividad. En desarrollo se usa MemoryStore; reiniciar el backend invalida las sesiones. No usar MemoryStore en producción.
- Las llamadas del navegador que usan sesión deben enviar `credentials: "include"`. CORS debe tener `credentials: true` y un origen concreto.

## Autenticación y usuarios

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `POST` | `/auth/registro` | Público | Crear cuenta turista |
| `POST` | `/auth/login` | Público | Iniciar sesión y establecer cookie |
| `POST` | `/auth/logout` | Público | Cerrar la sesión actual y borrar cookie |
| `GET` | `/auth/sesion` | Sesión | Validar sesión y devolver usuario |
| `GET` | `/usuarios/me` | Sesión | Consultar perfil propio |
| `PATCH` | `/usuarios/me` | Sesión | Modificar datos propios |
| `GET` | `/usuarios` | Administrador | Listar usuarios sin devolver hashes |

### Registro

`POST /auth/registro`

```json
{
  "identificacion": "123456789",
  "tipoDoc": "CC",
  "nombres": "Ana",
  "apellidos": "Pérez",
  "correo": "ana@example.com",
  "fechaNacimiento": "2000-01-15",
  "contrasena": "ClaveSegura2026"
}
```

La contraseña debe tener entre 8 y 128 caracteres e incluir al menos una letra y un número. Se almacena con scrypt; el cliente no puede asignar roles. El rol inicial es `turista`.

### Login

`POST /auth/login`

```json
{
  "correo": "ana@example.com",
  "contrasena": "ClaveSegura2026"
}
```

La cookie de sesión se configura en Express. Para frontend:

```ts
fetch("http://localhost:3000/auth/login", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ correo, contrasena }),
});
```

Para cerrar sesión: `POST /auth/logout`. Para cambiar la contraseña mediante `PATCH /usuarios/me`, envía solo los campos que quieras actualizar; no están permitidos `identificacion` ni `rol`.

## Búsqueda y sitios turísticos

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `POST` | `/ai/search` | Público | Interpretar consulta con Gemini o reglas locales |
| `GET` | `/sitios` | Público | Listar sitios; filtros opcionales `ciudad`, `categoriaId`, `categoria`, `calificacionMinima` y `precioMaximo` |
| `GET` | `/sitios/buscar?ciudad=Bogotá` | Público | Buscar sitios por ciudad; `ciudad` es obligatorio |
| `GET` | `/sitios/filtrar?ciudad=Bogotá&categoria=Museo&calificacionMinima=4&precioMaximo=20000` | Público | Filtrar búsqueda |
| `GET` | `/sitios/:id` | Público | Detalle, categoría, planes, promedio y cantidad de calificaciones |
| `POST` | `/sitios` | Administrador | Crear sitio |
| `PATCH` | `/sitios/:id` | Administrador | Actualizar sitio |
| `DELETE` | `/sitios/:id` | Administrador | Eliminar si no tiene planes, calificaciones ni favoritos asociados |

La búsqueda inteligente acepta una descripción libre y filtros opcionales que se combinan con lo que interpreta la IA. Los valores manuales tienen prioridad si contradicen un criterio extraído de la frase:

```json
{
  "query": "Quiero viajar con mi pareja a conocer Tunja",
  "filtros": {
    "precioMaximo": 50000,
    "calificacionMinima": 4
  }
}
```

La respuesta incluye los filtros aplicados, el modo de interpretación (`gemini` o `reglas-locales`) y los sitios coincidentes. El modo local reconoce las ciudades registradas en la base de datos.

`/sitios` es la API canónica para consultar y administrar destinos turísticos. No hay dos conjuntos de lugares: los registros se guardan en `sitioturistico`. `vista_lugares_backend` es una vista SQL de lectura que proyecta cada sitio al formato simplificado que necesitan las búsquedas y la interfaz, añadiendo categoría, precio mínimo de planes y promedio de calificaciones. La entidad TypeORM `Lugar` representa esa vista interna; no es otra tabla ni un endpoint separado. La antigua ruta `/lugares` ya no se registra; el frontend y la búsqueda pública usan `/sitios`.

### Crear sitio

`POST /sitios`

```json
{
  "nombre": "Museo de ejemplo",
  "descripcion": "Descripción del sitio",
  "ubicacion": "Carrera 1 # 2-3",
  "ciudad": "Bogotá",
  "imagen": null,
  "horario": "Martes a domingo",
  "idCategoria": 1,
  "latitud": 4.6,
  "longitud": -74.0
}
```

Latitud y longitud son opcionales y se validan contra sus rangos geográficos. El modelo SQL original no tenía estos campos; el script los añade como columnas opcionales.

## Categorías

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `GET` | `/categorias` | Público | Listar categorías |
| `GET` | `/categorias/:id` | Público | Consultar una categoría |
| `POST` | `/categorias` | Administrador | Crear categoría |
| `PATCH` | `/categorias/:id` | Administrador | Actualizar categoría |
| `DELETE` | `/categorias/:id` | Administrador | Eliminar si no hay sitios asociados |

Cuerpo de creación/actualización:

```json
{ "nombre": "Naturaleza", "descripcion": "Parques y paisajes" }
```

## Planes

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `GET` | `/planes?idSitio=1` | Público | Listar planes, opcionalmente por sitio |
| `GET` | `/planes/:id` | Público | Consultar un plan |
| `POST` | `/planes` | Administrador | Crear plan |
| `PATCH` | `/planes/:id` | Administrador | Actualizar plan |
| `DELETE` | `/planes/:id` | Administrador | Eliminar plan |

`POST /planes`:

```json
{
  "nombre": "Entrada general",
  "descripcion": "Acceso al sitio",
  "precio": 15000,
  "duracion": "2 horas",
  "cupo": 20,
  "idSitio": 1
}
```

`cupo` puede omitirse o enviarse como `null`. El precio no puede ser negativo.

## Calificaciones y comentarios

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `GET` | `/sitios/:id/calificaciones` | Público | Listar opiniones del sitio |
| `POST` | `/sitios/:id/calificaciones` | Sesión | Crear puntuación/comentario |
| `DELETE` | `/calificaciones/:id` | Autor o administrador | Eliminar calificación |

`POST /sitios/1/calificaciones`:

```json
{ "puntuacion": 5, "comentario": "Excelente lugar." }
```

La puntuación debe ser de 1 a 5; el comentario es opcional. El promedio se calcula a partir de `calificacion` y no se almacena duplicado.

## Favoritos

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `GET` | `/favoritos` | Sesión | Listar favoritos propios con datos del sitio |
| `POST` | `/favoritos/:idSitio` | Sesión | Agregar un favorito |
| `DELETE` | `/favoritos/:idSitio` | Sesión | Quitar un favorito |

## Preferencias

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `GET` | `/preferencias` | Público | Listar catálogo |
| `GET` | `/preferencias/:id` | Público | Consultar preferencia |
| `POST` | `/preferencias` | Administrador | Crear preferencia de catálogo |
| `PATCH` | `/preferencias/:id` | Administrador | Actualizar preferencia de catálogo |
| `DELETE` | `/preferencias/:id` | Administrador | Eliminar si no está asignada |
| `GET` | `/preferencias/me` | Sesión | Listar preferencias propias |
| `POST` | `/preferencias/me/:idPreferencia` | Sesión | Crear o actualizar interés |
| `DELETE` | `/preferencias/me/:idPreferencia` | Sesión | Quitar preferencia propia |

Para crear/actualizar el interés:

```json
{ "nivelInteres": 4 }
```

El nivel permitido está entre 1 y 5.

## Respuestas y errores

Las respuestas son JSON. Errores de entrada devuelven `400`, falta de autenticación `401`, permisos insuficientes `403`, recurso no encontrado `404` y conflictos de integridad `409`. Los errores de la base de datos deben revisarse en la salida del backend.

## Promover la primera cuenta a administradora

Registra una cuenta normal y luego asígnale el rol desde una sesión local controlada:

```sql
UPDATE usuario
SET rol = 'administrador'
WHERE identificacion = 'DOCUMENTO';
```

No se ofrece una API pública para asignar el rol administrador.

## Configuración

En `backend/.env` pueden configurarse `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `FRONTEND_ORIGIN` y `SESSION_SECRET`. En producción `SESSION_SECRET` es obligatorio. Configura HTTPS y reemplaza el MemoryStore por un almacén persistente antes de desplegar.
