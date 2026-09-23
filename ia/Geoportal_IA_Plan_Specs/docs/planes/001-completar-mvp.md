# Completar y verificar la spec 001

## Resultado observable

Completar T01–T07: consultar, filtrar, registrar y buscar lugares a 2 km desde el visor, con persistencia Point 4326 y el contrato HTTP de la spec 001.

## Estado actual

La entrega leída inicialmente contenía SQL, backend, visor y diez pruebas que pasaban. Al retomar la solicitud, backend, frontend y test estaban vacíos. Se implementan estos archivos conservando el contrato y corrigiendo los defectos detectados: radios positivos menores de un metro rechazados, errores de entrada tratados como 500 y consultas del visor fuera de orden o anteriores a la creación de la capa.

## Decisiones

- Mantener una raíz npm, las rutas existentes y coordenadas [longitud, latitud].
- Completar la validación y precisar sus límites en la spec.
- Usar parámetros enlazados y un índice de geography mediante SQL versionado.
- Ejecutar las pruebas espaciales en un esquema aislado, sin modificar lugares del usuario.
- Usar un clúster local independiente si los binarios PostGIS instalados permiten iniciarlo. No modificar los servicios PostgreSQL existentes.

## Trabajo

1. T01: precisar validación y comportamiento del visor.
2. T02–T04: completar SQL, configuración, consulta espacial y errores HTTP.
3. T05: corregir carga, concurrencia de consultas, coordenadas y confirmación del alta.
4. T06: ampliar pruebas de contrato y añadir integración real reproducible.
5. T07: registrar comandos, resultados y limitaciones en la guía y backlog.

## Verificación

`npm test`, `npm run build`, integración PostGIS y recorrido del visor: listado, filtro, clic, POST, popup y búsqueda a 2 km. Cada tarea tendrá una referencia a evidencia ejecutada.

## Riesgos y reversión

Las teselas necesitan Internet. El entorno dispone de PostgreSQL local, pero no de Docker en PATH. Los cambios de esquema son aditivos; la prueba integral crea y elimina únicamente su esquema temporal. El clúster de desarrollo y `.env` quedan excluidos de Git.

## Progreso

- 2026-09-19: lectura de instrucciones y revisión de T01–T07. Base inicial: 10 pruebas aprobadas y build correcto.
- 2026-09-19: implementación de backend y frontend tras encontrar sus carpetas vacías. Validación HTTP, SQL enlazado, índice geography y concurrencia del visor completados.
- 2026-09-19: revisión de la spec editada durante la implementación; nueva T08 para sonido al registrar y animación slide, sin alterar el contrato HTTP.
- 2026-09-19: pruebas sin base y siete casos de integración PostGIS aprobados; build correcto. Clúster independiente en 5434.
- 2026-09-19: cierre con 25 pruebas locales aprobadas, siete casos de integración y frontend compilado/Vite/proxy respondiendo 200. La base de desarrollo conserva sus tres semillas.
- 2026-09-19: revisión visual bloqueada porque Computer Use no pudo determinar la URL del navegador. Recorrido audiovisual manual documentado; no se presenta como verificación ejecutada.
