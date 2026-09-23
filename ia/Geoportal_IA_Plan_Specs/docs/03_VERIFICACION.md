# Verificación del geoportal

## Nivel 1: sin PostgreSQL

```powershell
npm test
npm run build
```

Las pruebas HTTP usan un repositorio falso. Verifican contrato, errores, coordenadas y ausencia de escrituras inválidas. También se prueban configuración, concurrencia de consultas, longitudes y sonido mediante un contexto de audio simulado. `npm run build` comprueba que Vite, MapLibre y Tailwind generen el frontend.

## Mapas base (CA01 de la spec 002)

`test/mapas-base.test.js` comprueba sin navegador el catálogo, los estilos raster y que elegir un mapa base llame a `setStyle` con `diff: false`; un identificador desconocido falla sin tocar el mapa.

Con el visor abierto en `http://localhost:5174`, abre el desplegable **Mapa base** del panel lateral y recorre las siete opciones. Cada cambio debe redibujar el fondo, mantener los puntos consultados y actualizar la atribución de la esquina inferior derecha.

Verificado en navegador sin errores de consola el 19/09/2026: los siete estilos cargan y la capa `lugares` se vuelve a crear en cada cambio; las teselas de Esri World Imagery y de Google calles respondieron 200. Un mapa gris al cambiar de proveedor suele indicar falta de Internet o bloqueo del extremo de teselas, no un fallo del visor.

## Nivel 2: con PostGIS

En la raíz del proyecto:

```powershell
docker compose up -d
docker compose ps
Copy-Item .env.example .env
npm run dev
```

Si el volumen de la base ya existía antes de incluir los SQL, ejecuta `npm run db:migrate` y `npm run db:seed`. La imagen de Docker ejecuta los archivos de `docker-entrypoint-initdb.d` solo al crear la base por primera vez.

La verificación automática con PostGIS real se ejecuta en otra terminal:

```powershell
npm run test:postgis
```

Usa `.env`, crea un esquema de nombre aleatorio, aplica los tres SQL dos veces y ejecuta la API con el repositorio real. Comprueba seeds, SRID, índices, filtros, alta, duplicados, Location y el límite de 200. Para CA06 construye puntos mediante `ST_Project` a 1999 m y 2001 m, y verifica inclusión/exclusión con radio de 2000 m. También prueba radio fraccionario y orden por distancia antes del redondeo. Al terminar elimina únicamente el esquema generado. PostGIS debe estar instalado y el usuario necesita permisos de creación de esquemas.

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
| CA02 | Integración: POST real, presencia en GeoJSON y SRID; actualización visual según recorrido manual |
| CA03 | Prueba automatizada de latitud inválida |
| CA04 | Prueba HTTP de filtro inválido |
| CA05 | Prueba HTTP de cabecera Location y GET |
| CA06 | `npm run test:postgis`: distancias conocidas, radio fraccionario, orden y `distancia_m` |
| CA07 | `npm test` y `npm run build` |
| CA08 | Pruebas de audio y build; escucha y movimiento según recorrido manual |

## Recorrido visual pendiente

1. Abrir `http://localhost:5174`: ver tres lugares de ejemplo y el mapa base.
2. Elegir Cultura: aparece únicamente la biblioteca. Abrir su popup y comprobar nombre, categoría y descripción.
3. Hacer clic en una zona libre: el marcador y los campos muestran longitud/latitud en ese orden.
4. Guardar un nombre nuevo: se limpia el formulario, aparece el lugar y se centra el mapa con su popup.
5. Pulsar **A 2 km**: filtro en Todas y resultados con distancia. Mover el mapa y repetir.
6. Cambiar categorías rápidamente: la última selección determina los resultados.
7. Comprobar el diseño con ventana estrecha: mapa arriba y formulario debajo, sin desbordamiento horizontal.
8. Registrar con **Sonido al guardar** activado y desactivado: solo el alta exitosa con sonido activado debe sonar. Un error de nombre duplicado debe ser silencioso.
9. Revisar la entrada slide de panel y resultados; con movimiento reducido activado en el dispositivo no deben animarse.

## Verificación de la entrega 2026-09-19

- Node.js 22.17.0; una única instalación npm en la raíz.
- `npm test`: 25 pruebas aprobadas, ninguna omitida.
- `npm run test:postgis`: 7 casos aprobados; Node cuenta además la prueba contenedora (8 en total). PostgreSQL 13.8/PostGIS 3.0 reales.
- `npm run build`: correcto. Vite avisa del tamaño del bundle de MapLibre; no es un fallo de compilación.
- Base local de desarrollo en `127.0.0.1:5434`, API en `127.0.0.1:3001` y Vite en `127.0.0.1:5174`.
- Comprobación HTTP final: salud/listo/listado/GeoJSON/cercanos devuelven 200; hay tres semillas y dos resultados a 2 km del centro de ejemplo. La página compilada y su JavaScript en 3001, Vite en 5174 y el proxy `/api/listo` también responden 200.
- Docker no está en PATH. Se usaron los binarios PostgreSQL/PostGIS instalados, en un clúster independiente dentro de `.local-postgis/`. No se modificaron los servicios PostgreSQL existentes.
- Revisión audiovisual no completada: la conexión de navegador no estaba disponible y Computer Use se detuvo porque no pudo determinar con suficiente confianza la URL actual de Chrome.

### Reiniciar la instancia de este equipo

El clúster local y `.env` están excluidos de Git. Para volver a iniciar el clúster ya creado en este PC, desde la raíz y con el puerto 5434 libre:

```powershell
$pgData = (Resolve-Path .local-postgis/data).Path
$pgLog = Join-Path (Resolve-Path .local-postgis).Path 'postgres.log'
$pgArgs = @('-D', ('"' + $pgData + '"'), '-l', ('"' + $pgLog + '"'), '-w', 'start')
$pgProcess = Start-Process -FilePath 'C:/Program Files/PostgreSQL/13/bin/pg_ctl.exe' -ArgumentList $pgArgs -WindowStyle Hidden -PassThru
$pgProcess.WaitForExit(10000)
npm run dev
```

Para detenerlo, después de cerrar el servidor con Ctrl+C:

```powershell
& 'C:/Program Files/PostgreSQL/13/bin/pg_ctl.exe' -D .local-postgis/data -m fast -w stop
```

En otro PC, seguir la instalación Docker o PostgreSQL local del README. No iniciar Docker en 5434 mientras el clúster local esté usando ese puerto.

## Diagnóstico breve

- `ECONNREFUSED`: comprueba `docker compose ps`, puerto 5434 y `.env`.
- `relation "lugares" does not exist`: ejecuta `npm run db:migrate` y `npm run db:seed`.
- `type "geometry" does not exist`: confirma que PostGIS esté instalado y ejecuta `CREATE EXTENSION IF NOT EXISTS postgis;` en esa base.
- Mapa gris: revisa Internet, consola del navegador y acceso a las teselas.
- Vite muestra la interfaz pero `/api` falla: confirma que Express siga activo en el puerto 3001.
