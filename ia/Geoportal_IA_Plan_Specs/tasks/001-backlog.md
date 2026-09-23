# Tareas del MVP

Cada tarea corresponde a una parte de la [spec 001](../specs/001-geoportal-mvp.md). Marca una tarea como terminada solo después de registrar la verificación.

| ID | Tarea | Archivos | Criterio |
| --- | --- | --- | --- |
| T01 | Definir alcance y contrato | `docs/01_PLAN.md`, `specs/001-geoportal-mvp.md` | Escenarios, rutas y datos decididos |
| T02 | Crear base espacial | `compose.yaml`, `db/init/*` | PostGIS, tabla, GIST y tres ejemplos |
| T03 | Configurar backend y modelo | `backend/config.js`, `db.js`, `model.js` | Conexión y Point 4326 |
| T04 | Implementar API | `backend/app.js`, `repository.js`, `domain.js` | CA01–CA06 |
| T05 | Construir visor | `frontend/*`, `vite.config.js` | Mapa, filtro, alta y búsqueda |
| T06 | Añadir pruebas | `test/*` | CA01, CA03–CA05, CA07 |
| T07 | Documentar IA y ejecución | `AGENTS.md`, `PLANS.md`, `agents/*`, skill, `README.md` | Otro alumno puede repetir el proceso |
| T08 | Sonido al registrar y animación slide | `frontend/src/sonido.js`, `main.js`, `style.css`, `index.html` | CA08, audio opcional y movimiento reducido |

## Estado de esta entrega

- [x] T01. Plan y spec revisados; contrato de validación, límites y comportamiento del visor explícitos. [Plan de ejecución](../docs/planes/001-completar-mvp.md).
- [x] T02. SQL y Compose preparados. Migraciones ejecutadas dos veces con PostgreSQL 13.8/PostGIS 3.0: tres semillas sin duplicados, Point 4326 e índices GIST comprobados por `npm run test:postgis`. Docker no está disponible; el contenedor no se ejecutó.
- [x] T03. Configuración y puertos validados, modelo Sequelize y conexión real comprobados con `/api/listo` y la integración.
- [x] T04. API implementada. Pruebas de CA01–CA06 con repositorio de prueba y PostGIS real, errores sin detalles internos y consulta espacial enlazada.
- [x] T05. Mapa, filtro, alta, popup y radio de 2 km implementados. Build y pruebas de concurrencia/longitudes correctos. Recorrido visual pendiente por bloqueo de Computer Use al identificar la URL de Chrome.
- [x] T06. Pruebas de dominio, HTTP, configuración, concurrencia y audio; integración real PostGIS reproducible. Resultados en la guía de verificación.
- [x] T07. README, guía de verificación, plan y backlog actualizados con comandos, evidencia y limitaciones. AGENTS, skill y roles revisados.
- [x] T08. Sonido de confirmación opcional y animación slide implementados. Pruebas del audio sin soporte/bloqueado y confirmación breve; build correcto. Revisión audiovisual manual pendiente junto al visor.

Los checks registran implementación y evidencia disponible. No afirman ejecución de Docker ni revisión visual/auditiva; esas limitaciones y el recorrido para completarlas están en [docs/03_VERIFICACION.md](../docs/03_VERIFICACION.md).

Registra aquí las incidencias de una ejecución de clase y abre una nueva tarea en lugar de alterar silenciosamente el alcance del MVP.
