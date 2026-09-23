# Instrucciones para agentes de este proyecto

Este repositorio enseña un flujo de desarrollo asistido por IA. Antes de cambiar funcionalidad, lee `docs/01_PLAN.md`, `specs/001-geoportal-mvp.md` y la tarea correspondiente en `tasks/001-backlog.md`.

- Una sola instalación de npm en la raíz. No crees `package.json` adicionales.
- Backend en `backend/`; frontend en `frontend/`; SQL versionado en `db/init/`.
- Conserva el contrato HTTP de `specs/001-geoportal-mvp.md`. Si cambia, actualiza spec, tarea, código y pruebas en la misma entrega.
- GeoJSON y PostGIS usan coordenadas `[longitud, latitud]` y SRID 4326. La búsqueda por radio recibe metros y usa `geography`.
- No uses `sequelize.sync({ alter: true })` ni cambios automáticos de esquema. Añade una migración SQL revisable.
- Responde errores de entrada con 400 o 422; no expongas detalles internos de PostgreSQL al cliente.
- Verifica con `npm test` y `npm run build`. Cuando PostGIS esté disponible, prueba además los endpoints reales del README.
- Considera terminada una tarea cuando su criterio de aceptación tenga una prueba o una comprobación manual documentada.

La skill especializada del repositorio está en `.agents/skills/geoportal-gis/SKILL.md`. Los TOML de `.codex/agents/` definen agentes personalizados que Codex puede usar cuando se le pida; no se ejecutan por sí solos. Los archivos de `agents/` son plantillas de rol legibles para prompts.
