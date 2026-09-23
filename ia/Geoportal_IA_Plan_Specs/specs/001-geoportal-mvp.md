# Spec 001: geoportal de lugares

Estado: implementada para el MVP. Esta spec es el contrato observable; el plan de trabajo está en `docs/01_PLAN.md`.

## Usuarios y escenarios

1. **Consultar:** una persona abre el mapa y ve los lugares de ejemplo con popup de nombre, categoría y descripción.
2. **Filtrar:** selecciona una categoría y solo ve lugares de esa categoría.
3. **Registrar:** hace clic en el mapa, completa nombre/categoría y guarda un Point.
4. **Buscar cerca:** centra el mapa y consulta lugares a un radio fijo de 2 km.

## Modelo de datos

`lugares(id, nombre, categoria, descripcion, geom)`.

- `id`: entero positivo único.
- `nombre`: texto de 1 a 120 caracteres, único.
- `categoria`: `salud`, `educacion`, `cultura` u `otro`.
- `descripcion`: texto opcional de hasta 500 caracteres.
- `geom`: `geometry(Point,4326)` no nula.
- Entrada y salida del Point: `[longitud, latitud]`. Rango de longitud −180 a 180 y latitud −90 a 90.

## Contrato HTTP

| Método y ruta | Entrada | Respuesta correcta |
| --- | --- | --- |
| GET `/api/salud` | ninguna | 200 `{"estado":"ok"}` |
| GET `/api/listo` | ninguna | 200 si la base responde |
| GET `/api/lugares` | `?categoria=cultura` opcional | 200 lista JSON, máximo 200 |
| GET `/api/lugares/:id` | id positivo | 200 lugar JSON, 404 si no existe |
| GET `/api/lugares/geojson` | categoría opcional | 200 `FeatureCollection`, `application/geo+json` |
| GET `/api/lugares/cercanos` | `lon`, `lat`, `radio` en metros | 200 `FeatureCollection` ordenada por distancia |
| POST `/api/lugares` | JSON con nombre, categoría, longitud, latitud y descripción opcional | 201, recurso y cabecera `Location` |

Ejemplo de POST:

```json
{"nombre":"Museo de prueba","categoria":"cultura","descripcion":"Práctica de clase","longitud":-77.035,"latitud":-12.061}
```

Ejemplo de una Feature:

```json
{"type":"Feature","id":1,"geometry":{"type":"Point","coordinates":[-77.035,-12.061]},"properties":{"nombre":"Museo de prueba","categoria":"cultura","descripcion":"Práctica de clase"}}
```

## Errores

- 400: filtro, id o búsqueda espacial inválidos; JSON mal formado, codificación no admitida o cuerpo mayor de 32 KiB. El id debe caber en un BIGINT positivo de PostgreSQL (máximo 9223372036854775807).
- 404: id o ruta ausentes.
- 409: nombre duplicado.
- 422: cuerpo de POST inválido.
- 500: error no previsto; no se expone la consulta SQL ni la contraseña.

Los errores usan `application/problem+json` con `type`, `title`, `status` y `detail`. El POST exige un objeto JSON; números como coordenadas, nombre no vacío después de quitar espacios y categoría conocida. Los textos no admiten caracteres nulos (`\u0000`). Un cuerpo ausente, un array o un valor escalar produce 422.

## Reglas espaciales

- `radio` debe ser >0 y ≤50 000 metros.
- Se admiten radios fraccionarios, por ejemplo `0.5` metros. Los parámetros espaciales deben aparecer una sola vez y ser números decimales finitos (se admite notación científica).
- El backend usa `ST_DWithin(geom::geography, punto::geography, radio)`.
- La respuesta cercana incluye `distancia_m` redondeada a una décima.
- La consulta SQL usa parámetros enlazados para longitud, latitud y radio.
- Las consultas devuelven como máximo 200 lugares. Los cercanos se ordenan por distancia real antes de redondear; en empate, por id.

## Comportamiento del visor

- La última consulta elegida determina la lista y la capa, aunque una petición anterior tarde más en responder.
- La lista puede consultarse mientras carga el mapa base. La búsqueda desde el centro se habilita cuando el mapa está listo.
- **A 2 km** consulta todas las categorías y restablece el filtro a **Todas**; cambiar categoría o pulsar **Actualizar** vuelve a la consulta general.
- Un alta correcta limpia el formulario, actualiza la capa y centra el lugar creado. Si falla la actualización posterior al alta, informa que el lugar se guardó y permite reintentar la consulta.
- Las longitudes de clic y centro se normalizan al intervalo −180 a 180, incluso al desplazarse a otra copia del mundo.

## Criterios de aceptación

- CA01: `GET /api/lugares/geojson` produce coordenadas `[longitud,latitud]`.
- CA02: un POST válido crea un lugar visible al actualizar el mapa.
- CA03: latitud 100 provoca 422 y no crea registro.
- CA04: filtro de categoría desconocida provoca 400.
- CA05: `Location` de un POST se puede consultar con GET.
- CA06: búsqueda a 2 km usa distancia en metros y retorna solo puntos dentro del radio.
- CA07: `npm test` y `npm run build` terminan correctamente.

## Animación del entorno web

- Al confirmar un registro con respuesta 201, suena una confirmación breve. Los errores no producen ese sonido.
- La opción **Sonido al guardar** permite silenciarlo. Si el navegador no admite audio, el registro sigue funcionando.
- El panel lateral, los resultados y la confirmación de registro aparecen mediante deslizamiento suave.
- Se respeta `prefers-reduced-motion`: las animaciones se desactivan cuando el usuario solicita movimiento reducido.
- CA08: un guardado exitoso reproduce la confirmación cuando el sonido está activado; el panel y los resultados usan animación de deslizamiento, con alternativa sin movimiento.
