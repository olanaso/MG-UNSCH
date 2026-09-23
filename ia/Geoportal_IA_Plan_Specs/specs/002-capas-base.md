# Spec 002: Agregar capas base

## Agregar capas base al mapa
1. Agregar mapa base  de google 
2. Agregar mapa base  de openstreetmaps
3. Agregar los de esri



## Criterios de aceptación

- CA01: Cada vez que cambio un mapa base este debe actualizar en el mapa


## Estado

Implementada. Tareas y evidencia en [tasks/002-backlog.md](../tasks/002-backlog.md).

## Catálogo de mapas base

| Identificador | Nombre en el visor | Origen |
| --- | --- | --- |
| `openfreemap` | OpenFreeMap Bright (vectorial) | Estilo vectorial inicial, el mismo del MVP |
| `openstreetmap` | OpenStreetMap | Teselas raster de `tile.openstreetmap.org` |
| `google-calles` | Google Maps (calles) | Teselas raster `lyrs=m` |
| `google-satelite` | Google Maps (satélite) | Teselas raster `lyrs=s` |
| `esri-satelite` | Esri World Imagery (satélite) | ArcGIS Online, orden `{z}/{y}/{x}` |
| `esri-calles` | Esri World Street Map | ArcGIS Online, orden `{z}/{y}/{x}` |
| `esri-topografico` | Esri World Topographic Map | ArcGIS Online, orden `{z}/{y}/{x}` |

Cada mapa base declara su atribución y se dibuja bajo la capa de lugares. Las teselas de Google se obtienen de un extremo no documentado: es válido para la práctica de clase, pero un despliegue público necesita la API oficial de Google Maps Tiles con clave.

## Comportamiento del visor

- El selector **Mapa base** aparece en el panel lateral y se llena desde el catálogo; el visor arranca con `openfreemap`.
- Cambiar de mapa base reemplaza el estilo completo del mapa. La fuente `lugares` y la capa `puntos` se vuelven a crear cuando el nuevo estilo termina de cargarse, con los datos de la última consulta.
- El centro, el zoom, el marcador de borrador y el formulario no se alteran al cambiar de mapa base.
- Mientras el estilo se carga, el aviso del mapa indica el cambio; al terminar vuelve a «Clic en el mapa: elegir coordenadas».

## Criterios de aceptación (detalle)

- CA01: cada cambio de mapa base actualiza el fondo del mapa y conserva los lugares consultados.
- CA02: `npm test` y `npm run build` terminan correctamente.
