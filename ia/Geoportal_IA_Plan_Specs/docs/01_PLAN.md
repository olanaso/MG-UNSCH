# Plan del MVP: geoportal de lugares

## Problema

El alumno necesita ver el trayecto completo de un dato geográfico: selección de coordenadas en un mapa, envío a una API, persistencia espacial en PostGIS y lectura como GeoJSON. El proyecto debe funcionar con una sola instalación de paquetes.

## Resultado observable

En `http://localhost:5174`, el usuario ve tres lugares de ejemplo, puede filtrar por categoría, registrar uno nuevo al hacer clic en el mapa y buscar lugares a 2 km del centro. La API ofrece JSON y GeoJSON.

## Alcance del MVP

- Tabla `lugares` con `geometry(Point,4326)` y un índice GIST.
- API Express con lectura, creación, filtrado y búsqueda por radio.
- Modelo Sequelize para escrituras y lecturas ordinarias. Consulta SQL espacial parametrizada para distancia.
- Visor MapLibre con Vite y Tailwind.
- Pruebas de validación y contrato HTTP sin necesidad de una base real; guía de comprobación integral con PostGIS.

Fuera de alcance: cuentas de usuario, archivos raster, edición de polígonos, carga masiva, despliegue público y sincronización en tiempo real.

## Decisiones de arquitectura

1. **Una raíz npm.** `package.json` concentra backend y frontend. `npm run dev` levanta ambos servidores.
2. **Migración SQL explícita.** El esquema se crea en `db/init/001_schema.sql`; `003_geography_index.sql` añade el índice para la búsqueda en metros. Sequelize no altera el esquema al iniciar.
3. **SRID 4326.** El navegador y GeoJSON trabajan con longitud/latitud. La distancia en metros convierte `geom` a `geography`.
4. **Límite de 200 filas.** Evita una descarga ilimitada en esta práctica. La paginación queda para una siguiente iteración.
5. **Frontend separado.** Vite redirige `/api` al servidor Express durante desarrollo; Express sirve `dist/frontend` después de `npm run build`.
6. **Base local.** Docker publica PostgreSQL solo en `127.0.0.1:5434` con credenciales de clase.

## Secuencia

| Fase | Entregable | Prueba |
| --- | --- | --- |
| P1 | Plan y spec | Criterios de aceptación y rutas definidos |
| P2 | SQL y modelo | Extensión, tabla, índice y datos de ejemplo |
| P3 | API | Pruebas HTTP y validación |
| P4 | Visor | `npm run build` y prueba manual de mapa |
| P5 | Documentación IA | AGENTS, skill, roles, tareas y prompts |

## Riesgos y comprobación

- Si Docker no está instalado, ejecuta el SQL en una instalación local de PostgreSQL con PostGIS.
- El mapa base requiere Internet. La API y los tests locales no dependen del proveedor de teselas.
- Las credenciales son para desarrollo local. Antes de desplegar, cambia secretos y añade autenticación.
- La auditoría actual de npm informa dos avisos moderados asociados a `uuid` como dependencia de Sequelize v6. No se aplica una actualización mayor automática que pueda romper compatibilidad; revisa la dependencia antes de publicar este ejemplo.
- El script de inicio de Docker solo se ejecuta al crear el volumen. En un volumen ya existente, usa `npm run db:migrate` y `npm run db:seed`.

La integración real se verifica con `npm run test:postgis` en un esquema temporal. La ampliación de la spec sobre sonido de registro y animación slide se implementa en T08, respetando movimiento reducido y permitiendo silenciar el audio.

## Fuentes técnicas

- [Express](https://expressjs.com/en/starter/installing/)
- [Sequelize GEOMETRY](https://sequelize.org/api/v6/class/src/data-types.js~geometry)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite)
