# Turismo IA

Aplicación web para explorar sitios turísticos de Colombia mediante filtros y búsquedas en lenguaje natural. El frontend usa React, TypeScript y Vite; el backend usa NestJS, TypeORM y MySQL. Gemini interpreta las consultas y el backend tiene reglas locales como alternativa.

## Estado del proyecto

### Hecho en el código

- [x] Frontend React + TypeScript con catálogo visual, filtros combinables y búsqueda en lenguaje natural; la búsqueda muestra los criterios interpretados y conserva los filtros elegidos.
- [x] Formularios de inicio de sesión y registro conectados con las rutas de autenticación.
- [x] Vistas de favoritos y preferencias personales conectadas con la cuenta autenticada.
- [x] Vista “Para ti” filtrada por intereses guardados y ordenada por nivel de afinidad.
- [x] Panel de administración protegido por rol con resumen, gestión de sitios/categorías/planes/preferencias y consulta de usuarios.
- [x] Detalle de sitios con planes, calificaciones y publicación de opiniones.
- [x] Backend NestJS con búsqueda de lugares y búsqueda inteligente con Gemini/fallback local.
- [x] Esquema original de TurisMatch conservado; `/sitios` es el único recurso público de destinos y `vista_lugares_backend` adapta sus datos para la búsqueda.
- [x] APIs por dominio para autenticación, perfiles, sitios, categorías, planes, calificaciones, favoritos y preferencias.
- [x] Contraseñas nuevas almacenadas con scrypt y permisos de administrador en endpoints de gestión.
- [x] Sesiones Express con cookie HttpOnly y expiración por inactividad de 30 minutos. MemoryStore es solo para desarrollo local.
- [x] Documentación separada de rutas y contratos en [API.md](./API.md).

### Falta ejecutar o completar

- [x] Aplicar/verificar el script [turisMatch.sql](./turisMatch.sql) en la instancia MySQL local.
- [ ] Configurar `backend/.env` con conexión MySQL y `SESSION_SECRET` para un despliegue real.
- [x] Crear una cuenta turista y una administradora de demostración en MySQL local.
- [x] Probar endpoints de categorías y sitios contra MySQL local.
- [x] Crear y verificar datos de demostración relacionados para planes, calificaciones, favoritos y preferencias personales.
- [x] Conectar formularios de login/registro, favoritos, preferencias y calificaciones en el frontend.
- [x] Implementar la interfaz “Ver detalle” consumiendo `GET /sitios/:id`.
- [x] Verificar login, catálogo, detalle, planes, calificaciones, favoritos y preferencias con MySQL, frontend y backend.
- [ ] Antes de producción, reemplazar MemoryStore por un almacén persistente de sesiones, configurar HTTPS y revisar CORS.

## Estructura principal

```text
backend/src/
├── ai/               # Interpretación de consultas
├── auth/             # Registro, login, cierre y protección de sesión
├── calificaciones/  # Reseñas y puntuaciones
├── categorias/       # Catálogo de categorías
├── common/           # Tipos, validaciones y permisos compartidos
├── database/entities/ # Entidades TypeORM
├── favoritos/        # Favoritos por usuario
├── lugares/          # Modelo/vista de lectura para búsqueda interna (sin rutas públicas)
├── planes/           # Planes y precios
├── preferencias/     # Catálogo y preferencias personales
├── sitios/           # Sitios turísticos y detalle completo
└── usuarios/         # Perfil y administración de usuarios
```

## Requisitos y ejecución local

- Node.js compatible con las versiones de dependencias del proyecto.
- MySQL/MariaDB y la base `turismo_ia`.
- Clave opcional `GEMINI_API_KEY` en `backend/.env`; la búsqueda usa reglas locales si falta. `VITE_API_URL` puede definir el origen del backend (por defecto `http://localhost:3000`). No publiques secretos.

## Base de datos

El script conserva las tablas originales `categoria`, `sitioturistico`, `usuario`, `calificacion`, `favorito`, `plan`, `preferencia` y `usuariopreferencia`. Agrega `latitud` y `longitud` opcionales cuando no existan y crea la vista `vista_lugares_backend`. Sitios turísticos y lugares no son dos conjuntos separados: `/sitios` es el recurso canónico, y la vista solo adapta los mismos registros para ofrecer campos calculados como precio mínimo y promedio de calificaciones.

Las sesiones se guardan en la memoria del proceso Express en desarrollo: **no requieren una tabla SQL**. Al reiniciar el servidor se cierran las sesiones activas.

### Datos relacionados de demostración

En la base local, el sitio previo se conserva y hay cinco sitios marcados `DEMO`. Cada uno tiene una categoría y un plan de prueba vinculado. La cuenta turista de demostración tiene cinco preferencias asignadas (con nivel de interés), tres favoritos ligados a sitios y tres calificaciones ligadas a los sitios 2, 4 y 6. En total, el catálogo contiene cinco preferencias y hay cinco planes para los sitios de demostración.

Los planes usan precios técnicos de prueba y no son ofertas comerciales. Las descripciones indican que los detalles turísticos reales están pendientes de confirmar; no se deben presentar como información verificada. Estos datos permiten validar las relaciones entre `sitioturistico`, `categoria`, `plan`, `preferencia`, `usuariopreferencia`, `favorito`, `calificacion` y `usuario` desde los endpoints.

## Configuración del backend

Valores locales predeterminados: `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USERNAME=root`, `DB_PASSWORD=` y `DB_DATABASE=turismo_ia`. Se pueden sobrescribir en `backend/.env`. `FRONTEND_ORIGIN` define el origen permitido para CORS (por defecto `http://localhost:5173`).

En producción configura un `SESSION_SECRET` fuerte mediante el entorno; el backend se niega a iniciar en producción si falta. No uses MemoryStore en producción.

## Documentación

- [API.md](./API.md): rutas, permisos, ejemplos de solicitudes y autenticación.
- [turisMatch.sql](./turisMatch.sql): estructura MySQL conservando el modelo original.
