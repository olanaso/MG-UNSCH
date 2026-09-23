# Verificación del geoportal

## Nivel 1: sin PostgreSQL

```powershell
npm test
npm run build
```

Las pruebas usan un repositorio falso. Verifican el contrato HTTP y las reglas de coordenadas sin conectarse a una base. `npm run build` comprueba que Vite, MapLibre y Tailwind generen el frontend.

## Nivel 2: con PostGIS

En la raíz del proyecto:

```powershell
docker compose up -d
docker compose ps
Copy-Item .env.example .env
npm run dev
```

Si el volumen de la base ya existía antes de incluir los SQL, ejecuta `npm run db:migrate` y `npm run db:seed`. La imagen de Docker ejecuta los archivos de `docker-entrypoint-initdb.d` solo al crear la base por primera vez.

En otra terminal:

```powershell
Invoke-RestMethod http://localhost:3001/api/salud
Invoke-RestMethod http://localhost:3001/api/listo
Invoke-RestMethod http://localhost:3001/api/lugares
Invoke-RestMethod http://localhost:3001/api/lugares/geojson | ConvertTo-Json -Depth 8
```

Comprueba una búsqueda a 2 km:

```powershell
Invoke-RestMethod 'http://localhost:3001/api/lugares/cercanos?lon=-77.037&lat=-12.065&radio=2000' | ConvertTo-Json -Depth 8
```

La propiedad `distancia_m` debe expresar metros. Puede haber cero resultados para otro centro o un radio pequeño.

Crea un lugar:

```powershell
$nuevo = @{
  nombre = 'Museo de práctica'
  categoria = 'cultura'
  descripcion = 'Creado en la clase'
  longitud = -77.031
  latitud = -12.057
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/lugares -Method Post -ContentType 'application/json' -Body $nuevo
```

Abre `http://localhost:5174`, pulsa **Actualizar** y busca el punto. Haz clic en un espacio vacío del mapa para cargar coordenadas en el formulario.

Comprueba la geometría en SQL:

```powershell
docker compose exec db psql -U geoportal -d geoportal -c "SELECT nombre, ST_SRID(geom) AS srid, ST_AsText(geom) AS wkt FROM lugares ORDER BY id;"
```

## Matriz de aceptación

| Criterio | Evidencia |
| --- | --- |
| CA01 | `npm test` y GET GeoJSON |
| CA02 | POST real, actualización del mapa y consulta SQL |
| CA03 | Prueba automatizada de latitud inválida |
| CA04 | Prueba HTTP de filtro inválido |
| CA05 | Prueba HTTP de cabecera Location y GET |
| CA06 | Consulta real de cercanos y `distancia_m` |
| CA07 | `npm test` y `npm run build` |

## Diagnóstico breve

- `ECONNREFUSED`: comprueba `docker compose ps`, puerto 5434 y `.env`.
- `relation "lugares" does not exist`: ejecuta `npm run db:migrate` y `npm run db:seed`.
- `type "geometry" does not exist`: confirma que PostGIS esté instalado y ejecuta `CREATE EXTENSION IF NOT EXISTS postgis;` en esa base.
- Mapa gris: revisa Internet, consola del navegador y acceso a las teselas.
- Vite muestra la interfaz pero `/api` falla: confirma que Express siga activo en el puerto 3001.
