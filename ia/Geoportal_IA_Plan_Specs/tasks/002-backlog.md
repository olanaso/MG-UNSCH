# Tareas de mapas base

Cada tarea corresponde a una parte de la [spec 002](../specs/002-capas-base.md). Marca una tarea como terminada solo después de registrar la verificación.

| ID | Tarea | Archivos | Criterio |
| --- | --- | --- | --- |
| T09 | Catálogo de mapas base | `frontend/src/mapas-base.js` | Google, OpenStreetMap y Esri con estilo MapLibre válido |
| T10 | Selector en el visor | `frontend/index.html`, `frontend/src/main.js` | CA01: cambiar de mapa base actualiza el mapa |
| T11 | Pruebas y verificación | `test/mapas-base.test.js`, `docs/03_VERIFICACION.md` | `npm test`, `npm run build` y recorrido en navegador |

## Estado de esta entrega

- [x] T09. Siete mapas base: OpenFreeMap Bright (vectorial, inicial), OpenStreetMap, Google calles y satélite, y Esri satélite, calles y topográfico. Las teselas raster se declaran en un solo lugar y el estilo se construye de nuevo en cada llamada porque MapLibre modifica el objeto que recibe.
- [x] T10. Selector **Mapa base** en el panel lateral, poblado desde el catálogo. `aplicarMapaBase` llama a `setStyle` con `diff: false` para forzar una carga completa; la capa `lugares` y su fuente se vuelven a crear en `style.load`, de modo que los puntos consultados sobreviven al cambio. Los escuchas de clic y cursor se registran una sola vez porque MapLibre los resuelve por identificador de capa.
- [x] T11. `npm test` (41 pruebas) y `npm run build` correctos. Recorrido en navegador sin errores de consola: los siete mapas base cargan su estilo y las teselas de Esri y Google responden 200. Evidencia en [docs/03_VERIFICACION.md](../docs/03_VERIFICACION.md).

## Limitación conocida

Las teselas de Google se piden a un extremo no documentado (`mt0-3.google.com/vt`). Sirve para comparar proveedores en clase; un despliegue público necesita la API oficial de Google Maps Tiles con clave y la aceptación de sus condiciones de uso. Las teselas de OpenStreetMap se sirven desde su infraestructura comunitaria, sujeta a su política de uso de teselas.
