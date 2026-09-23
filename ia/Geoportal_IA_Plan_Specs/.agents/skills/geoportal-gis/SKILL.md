---
name: geoportal-gis
description: Implementar o revisar cambios de geometrías, GeoJSON, PostGIS y MapLibre dentro de este geoportal. No usar para tareas ajenas al proyecto SIG.
---

# Geoportal GIS

Lee la especificación aplicable en `specs/` y la tarea en `tasks/` antes de editar. Conserva los siguientes invariantes del proyecto:

- En GeoJSON, `Point.coordinates` es `[longitud, latitud]`; en la base, `geom` es `geometry(Point,4326)`.
- Para distancias en metros con datos 4326, usa `geography` o una proyección métrica adecuada y declara la unidad de la respuesta.
- Valida rangos de coordenadas, categoría y tamaño de los campos antes de escribir.
- Usa parámetros enlazados en SQL espacial; nunca concatena valores enviados por el cliente.
- Después de editar, prueba el contrato HTTP y el build del visor. Si la base real no está disponible, declara esa limitación y deja el comando de comprobación manual.

Cuando cambies un endpoint, actualiza primero o al mismo tiempo su contrato en `specs/001-geoportal-mvp.md`.
