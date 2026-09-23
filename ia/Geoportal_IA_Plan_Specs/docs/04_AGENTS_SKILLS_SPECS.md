# AGENTS, SKILLS y SPECS con un ejemplo SIG

Una forma práctica de programar con IA es darle tres clases de contexto: **reglas estables del proyecto**, **un método especializado** y **un contrato para la funcionalidad concreta**. En este repositorio se expresan mediante `AGENTS.md`, una `SKILL.md` y una spec. Después se divide el trabajo en tareas y se comprueba el resultado.

La idea se entiende mejor con un único caso: **registrar un centro de salud desde un mapa**.

## El caso que construiremos

Una persona hace clic en un punto de Lima, escribe «Centro de Salud A», elige la categoría `salud` y pulsa **Guardar**. El navegador envía:

```json
{
  "nombre": "Centro de Salud A",
  "categoria": "salud",
  "descripcion": "Punto de práctica",
  "longitud": -77.031,
  "latitud": -12.057
}
```

La API valida el JSON y guarda un `Point` en PostgreSQL/PostGIS. Después, el visor consulta GeoJSON y dibuja el punto. El orden `[-77.031, -12.057]` significa **[longitud, latitud]**.

## 1. AGENTS.md: reglas que se mantienen en todas las tareas

[AGENTS.md](../AGENTS.md) dice a la IA **cómo trabajar en este repositorio**. Se usa tanto al crear el primer endpoint como al corregir un popup meses después. Codex lo carga como contexto del proyecto cuando trabaja en la carpeta. Por ejemplo:

```markdown
# Reglas del geoportal
- Usa un solo package.json en la raíz.
- El backend vive en backend/ y el visor en frontend/.
- GeoJSON usa [longitud, latitud] y SRID 4326.
- Antes de cambiar un endpoint, revisa su spec.
- Ejecuta npm test y npm run build.
```

Estas reglas evitan errores recurrentes: invertir las coordenadas, instalar dependencias en cada carpeta o modificar una ruta sin actualizar su contrato. `AGENTS.md` tampoco decide el nombre del próximo lugar ni el texto exacto de cada respuesta; eso corresponde a una spec.

**Pregunta docente:** si mañana construimos una capa de hospitales, ¿seguirá aplicando la regla `[longitud, latitud]`? Sí. Por eso pertenece a `AGENTS.md`.

## 2. SKILL.md: método reusable para un trabajo especializado

La [skill geoportal-gis](../.agents/skills/geoportal-gis/SKILL.md) explica **qué revisar cuando la tarea requiere conocimientos GIS**. Puede seleccionarse por su descripción o invocarse como `$geoportal-gis` en un prompt. En este ejemplo orienta a la IA a:

1. Leer la spec de la funcionalidad.
2. Confirmar que `geom` sea `geometry(Point,4326)`.
3. Validar longitud entre −180 y 180 y latitud entre −90 y 90.
4. Construir `Point.coordinates` en orden `[longitud, latitud]`.
5. Probar la respuesta GeoJSON y el visor.

Fragmento mínimo de una skill:

```markdown
---
name: geoportal-gis
description: Implementar o revisar geometrías, GeoJSON, PostGIS y MapLibre de este geoportal.
---

Antes de editar, lee la spec.
Para Point 4326, usa [longitud, latitud].
Para distancias en metros, usa geography o una proyección métrica adecuada.
Verifica el contrato HTTP y el build del visor.
```

Una skill contiene un **procedimiento que se puede reutilizar**. Si mañana agregamos una búsqueda por radio, la misma skill ayuda a recordar que `ST_DWithin` sobre coordenadas 4326 requiere cuidar la unidad. La spec de esa nueva búsqueda indicará el radio permitido y la forma exacta de la respuesta.

## 3. SPEC: comportamiento que debe cumplir esta funcionalidad

La [spec 001](../specs/001-geoportal-mvp.md) responde **qué debe observar el usuario y qué contrato ofrece la API**. Para registrar un centro de salud, una versión reducida de la spec sería:

```markdown
## Alta de un lugar
Ruta: POST /api/lugares
Entrada: nombre, categoria, longitud, latitud, descripcion opcional.
Categoria permitida: salud, educacion, cultura u otro.
Éxito: HTTP 201, JSON del lugar y cabecera Location.
Error: latitud fuera de rango produce HTTP 422.
Persistencia: geom es Point con SRID 4326.

Criterios de aceptación:
- Un POST válido aparece en GET /api/lugares/geojson.
- GeoJSON contiene coordinates: [longitud, latitud].
- Latitud 100 se rechaza y no crea registro.
```

La spec es verificable. Si una IA devuelve 200 en vez de 201, crea la geometría con latitud primero o acepta latitud 100, sabemos que la implementación incumple el contrato. Las specs se leen de forma explícita en el prompt o porque `AGENTS.md` remite a ellas.

## Cómo se relacionan los tres archivos

| Pregunta | Archivo | Respuesta en el ejemplo |
| --- | --- | --- |
| ¿Cómo trabaja la IA en este proyecto? | `AGENTS.md` | Separa backend y frontend, actualiza contrato y ejecuta pruebas. |
| ¿Qué método técnico usa para tareas GIS? | `SKILL.md` | Revisa orden de coordenadas, SRID, unidades y GeoJSON. |
| ¿Qué debe hacer esta funcionalidad? | `specs/001-geoportal-mvp.md` | POST crea un lugar; 201 si funciona, 422 si la latitud es inválida. |

Los [agentes personalizados TOML](../.codex/agents/geo_arquitecto.toml) son otra pieza: definen **roles de ejecución**, como arquitecto, implementador y revisor. No son sinónimo de `AGENTS.md`. Las [tareas](../tasks/001-backlog.md) dividen la spec en trabajo que puede implementarse y verificarse por etapas.

## Del documento al código real

La spec pide un POST. En [backend/domain.js](../backend/domain.js), `validarNuevoLugar` revisa campos y crea:

```javascript
geom: {
  type: 'Point',
  coordinates: [longitud, latitud]
}
```

En [backend/model.js](../backend/model.js), Sequelize representa la columna espacial:

```javascript
geom: {
  type: DataTypes.GEOMETRY('POINT', 4326),
  allowNull: false
}
```

En [backend/app.js](../backend/app.js), `POST /api/lugares` usa esa validación, llama al repositorio y responde 201. En [test/app.test.js](../test/app.test.js) y [test/domain.test.js](../test/domain.test.js) se verifica el resultado. Este recorrido muestra dónde termina cada decisión:

```text
AGENTS: respetar el contrato y probar
SKILL: Point 4326 con [longitud, latitud]
SPEC: POST, campos, 201, 422 y criterios
TAREA: implementar y comprobar el alta
CÓDIGO: validación, modelo, ruta y visor
PRUEBA: éxito y error observables
```

## Prompt completo para repetir el ejercicio

Abre Codex en la raíz del proyecto y escribe:

> Lee AGENTS.md y specs/001-geoportal-mvp.md. Usa $geoportal-gis. Toma la tarea T04 del backlog. Implementa o revisa el alta de lugares: POST /api/lugares debe guardar un Point 4326 con coordinates [longitud, latitud], devolver 201 y rechazar latitud 100 con 422. Muestra qué archivos cambiaste, ejecuta npm test y npm run build, y señala cualquier comprobación pendiente con PostGIS real.

El prompt identifica **contexto, skill, tarea, comportamiento y evidencia**. La IA puede tomar decisiones de implementación dentro de ese marco, y las pruebas muestran si el resultado cumple la spec.

## Ejercicio para el alumno

Añade una categoría `deporte`. Antes del código:

1. Actualiza la spec con la nueva categoría y un criterio de aceptación.
2. Añade una tarea que enumere SQL, validación, frontend y prueba.
3. Pide a la IA que use `$geoportal-gis` para implementarla.
4. Ejecuta `npm test`, `npm run build` y prueba el POST real.
5. Revisa si hay una nueva regla reusable que merezca actualizar la skill. La lista de categorías pertenece a la spec y a la validación del producto, así que no hace falta copiarla en `AGENTS.md`.

## Referencias

- [Buenas prácticas de Codex para AGENTS.md](https://developers.openai.com/es-419/guides/best-practices)
- [Crear skills](https://developers.openai.com/es-419/docs/build-skills)
- [Agentes personalizados](https://developers.openai.com/codex/subagents)
- [GeoJSON, RFC 7946](https://datatracker.ietf.org/doc/rfc7946/)
