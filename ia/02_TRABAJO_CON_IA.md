# Cómo programar este geoportal con IA

Esta guía separa cinco artefactos que suelen confundirse:

| Archivo | Pregunta que responde | Cuándo se consulta |
| --- | --- | --- |
| `docs/01_PLAN.md` | ¿Qué construiremos y en qué orden? | Al iniciar y cuando cambie el alcance |
| `specs/001-geoportal-mvp.md` | ¿Qué comportamiento observable debe cumplir? | Antes de codificar y al revisar |
| `tasks/001-backlog.md` | ¿Cuál es la siguiente unidad de trabajo? | En cada iteración |
| `AGENTS.md` | ¿Qué reglas duraderas debe seguir el asistente en este repositorio? | El agente lo carga como contexto del proyecto |
| `.agents/skills/geoportal-gis/SKILL.md` | ¿Qué método especializado aplica a cambios GIS? | Al invocar `$geoportal-gis` o cuando la tarea coincida |

Los archivos `agents/arquitecto.md`, `agents/implementador.md` y `agents/revisor.md` son **prompts de rol**. Sirven incluso con una sola sesión de IA. Los TOML de `.codex/agents/` definen roles personalizados que Codex puede usar al delegar una tarea. Ninguna definición ejecuta tres procesos automáticamente.

## Iteración 0. Preparar el contexto

1. Abre la carpeta raíz `geoportal-ia-plan-specs` en Codex o tu editor.
2. Verifica que la conversación use esa carpeta como directorio de trabajo; así encuentra `AGENTS.md` y la skill del repositorio.
3. Pide primero un inventario de archivos y un resumen del flujo `plan → spec → tareas → código → pruebas`.
4. No entregues contraseñas reales al prompt. Usa `.env.example` para mostrar los nombres de variables; conserva valores reales solo en `.env`.

Si el ejercicio va a evolucionar, inicia Git en la carpeta y guarda una versión estable antes de cada tarea. Un cambio pequeño por tarea facilita revisar qué propuso la IA y volver atrás si una hipótesis falla. `.gitignore` ya excluye `.env`, dependencias y compilados.

Prompt inicial:

> Lee AGENTS.md, docs/01_PLAN.md, specs/001-geoportal-mvp.md y tasks/001-backlog.md. Explícame el objetivo del MVP, el orden de implementación, los criterios de aceptación y cualquier contradicción antes de editar archivos.

Cuando una función sea grande y permita revisión independiente, puedes pedir: «Usa geo_arquitecto para revisar la spec, geo_implementador para una tarea concreta y geo_revisor para comprobar el resultado». Para esta práctica pequeña también puedes trabajar con una sola sesión y usar los prompts de `agents/` en secuencia. [Codex documenta los agentes personalizados del proyecto](https://developers.openai.com/codex/subagents).

## Iteración 1. Planificación

La IA ayuda a transformar una idea en un resultado verificable. Aquí el resultado es “hacer clic en un mapa, guardar el punto en PostGIS y volver a verlo como GeoJSON”.

Prompt:

> Actúa con el rol de agents/arquitecto.md. Revisa docs/01_PLAN.md. Mantén el MVP pequeño. Identifica decisiones pendientes sobre datos, API, frontend y pruebas. Actualiza el plan si encuentras un vacío concreto. No escribas código todavía.

Revisa el plan como docente: ¿el alumno puede explicar por qué usa PostGIS?, ¿se sabe qué queda fuera?, ¿hay un comando para comprobar cada fase? Si cambia el objetivo, edita el plan antes de ampliar el código.

## Iteración 2. Especificación

La spec convierte el objetivo en contrato. Define entradas, salidas, errores y criterios de aceptación. Para evitar ambigüedad, el radio está en **metros** y el punto usa **[longitud, latitud]**.

Prompt:

> Revisa specs/001-geoportal-mvp.md como contrato implementable. Para cada escenario, comprueba que hay ruta, entrada, respuesta y código de error. Mejora solo las partes ambiguas. Añade criterios de aceptación que puedan verificarse con pruebas o pasos manuales.

No pidas “haz un geoportal completo” sin un contrato. Esa instrucción deja abiertas decisiones de datos, permisos, geometrías y alcance.

## Iteración 3. Desglose en tareas

Una tarea debe ser pequeña y tener evidencia de terminación. `tasks/001-backlog.md` separa SQL, backend, visor, pruebas y documentación. El orden importa: el visor necesita un contrato GeoJSON estable.

Prompt:

> Descompón la spec 001 en tareas de 1 a 3 archivos principales. Para cada tarea, indica criterio de aceptación, dependencias y comandos de verificación. Actualiza tasks/001-backlog.md sin agregar funcionalidades fuera del MVP.

## Iteración 4. Implementación con una tarea

Trabaja una tarea por vez. Ejemplo para la API espacial:

> Usa $geoportal-gis y el rol agents/implementador.md. Implementa T04 según specs/001-geoportal-mvp.md. Conserva el contrato HTTP. Añade pruebas para coordenadas y errores. Ejecuta npm test y npm run build. Explica qué no pudiste comprobar sin PostGIS real.

La IA puede escribir código, pero la evidencia manda: la spec y las pruebas deben mostrar que la conducta es correcta. Si una prueba falla, corrige la causa y repite la prueba.

## Iteración 5. Revisión

Pide una revisión enfocada en fallos concretos:

> Usa agents/revisor.md. Compara el cambio con los criterios CA01–CA07. Busca coordenadas invertidas, distancia con unidad equivocada, SQL no parametrizado, respuestas HTTP inconsistentes y errores visibles en el visor. Entrega hallazgos con archivo y línea. Corrige los confirmados y vuelve a verificar.

Para un cambio grande, crea primero un plan nuevo siguiendo `PLANS.md`. Para una corrección pequeña dentro del contrato existente, la tarea puede ser suficiente.

## Iteración 6. Demostración y cierre

Ejecuta `npm test`, `npm run build` y las pruebas reales del [README](../README.md). Marca la tarea terminada con la evidencia. Deja explícito cualquier paso no comprobado por falta de Docker, credenciales o Internet.

Prompt:

> Verifica el proyecto de extremo a extremo según docs/03_VERIFICACION.md. Resume lo que pasó, qué falló y qué queda pendiente. Actualiza el estado de la tarea solo con evidencia observada.

## Cómo evolucionar el método

Cuando el grupo detecte una regla recurrente, añádela a `AGENTS.md` si es general del repositorio. Si la regla solo afecta cálculos GIS, añádela a la skill. Si afecta únicamente una funcionalidad, escríbela en la spec. Evita copiar la misma instrucción en los tres lugares.

Referencias oficiales: [prácticas de Codex](https://developers.openai.com/es-419/guides/best-practices) y [skills locales](https://developers.openai.com/es-419/docs/build-skills).
