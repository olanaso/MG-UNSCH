# Geoportal sencillo con desarrollo asistido por IA

Proyecto de clase completo: **una instalación npm en la raíz**, backend Express + Sequelize + PostgreSQL/PostGIS, visor MapLibre + Vite + Tailwind y documentos para trabajar con IA mediante plan, especificación, tareas, skill y roles de agente.

La IA ayuda a planificar y programar el proyecto; el geoportal en ejecución no llama a una API de IA ni requiere una clave de OpenAI.

El ejemplo registra puntos de interés de Lima. Las coordenadas de muestra son ilustrativas para la práctica; comprueba su posición si las usarás como datos oficiales.

## 1. Qué vas a aprender

El flujo funcional:

```text
Clic en MapLibre
  → [longitud, latitud]
  → POST /api/lugares
  → Express valida
  → Sequelize escribe un Point en PostGIS
  → GET /api/lugares/geojson
  → MapLibre actualiza la capa
```

El flujo de trabajo con IA:

```text
idea → docs/01_PLAN.md → specs/001-geoportal-mvp.md
     → tasks/001-backlog.md → código → pruebas → revisión
```

Lee [Cómo programar con IA](docs/02_TRABAJO_CON_IA.md) para copiar prompts concretos en cada fase.
Si primero quieres entender los tres conceptos principales con un solo caso, lee [AGENTS, SKILLS y SPECS con un ejemplo SIG](docs/04_AGENTS_SKILLS_SPECS.md).

## 2. Requisitos del PC

- Node.js **22.12 o superior** y npm. Vite 7 requiere Node 20.19+ o 22.12+; este proyecto fija la rama 22.12+ para simplificar la clase.
- Docker Desktop y Docker Compose para la opción guiada de PostGIS. Como alternativa, PostgreSQL con la extensión PostGIS ya instalada.
- Internet para descargar paquetes con npm y para obtener el estilo y las teselas cada vez que abras el mapa.

Abre la carpeta raíz del proyecto en tu editor o en Codex. En PowerShell, comprueba:

```powershell
node --version
npm --version
docker --version
```

## 3. Prepara los archivos de trabajo con IA

Antes de ejecutar, abre estos documentos en este orden:

1. [AGENTS.md](AGENTS.md): reglas permanentes para el asistente dentro del repositorio.
2. [Plan](docs/01_PLAN.md): objetivo, alcance, arquitectura, riesgos y orden.
3. [Spec 001](specs/001-geoportal-mvp.md): historias, datos, rutas HTTP y criterios de aceptación.
4. [Backlog](tasks/001-backlog.md): tareas pequeñas vinculadas a la spec.
5. [Roles](agents/arquitecto.md): ejemplos de prompts para arquitecto, implementador y revisor.
6. `.codex/agents/`: definiciones TOML de agentes personalizados del proyecto.
7. [Skill GIS](.agents/skills/geoportal-gis/SKILL.md): reglas especializadas de coordenadas, SRID y distancia.

`AGENTS.md`, la skill y los TOML de `.codex/agents/` tienen mecanismos de descubrimiento de Codex. Los archivos Markdown de `agents/` son plantillas de texto que eliges y pegas en un prompt. Ninguna de estas definiciones inicia agentes automáticamente.

## 4. Instalación única

Sitúa PowerShell en la raíz `geoportal-ia-plan-specs` y ejecuta:

```powershell
npm install
```

No ejecutes `npm install` dentro de `backend` o `frontend`. Los dos usan las dependencias del único `package.json`.

## 5. Base de datos espacial

Con Docker:

```powershell
docker compose up -d
docker compose ps
```

`compose.yaml` levanta `postgis/postgis:16-3.5` en **127.0.0.1:5434**. En la primera creación del volumen, aplica `db/init/001_schema.sql`, `002_seed.sql` y `003_geography_index.sql`: activa PostGIS, crea `lugares`, los índices GIST de geometría y geography e inserta tres puntos de ejemplo.

Si usas una instalación local de PostgreSQL + PostGIS, crea una base `geoportal`, ejecuta los tres archivos SQL en ese orden como usuario con permisos y ajusta `.env` a tu host, puerto y credenciales. Por ejemplo:

```powershell
psql -v ON_ERROR_STOP=1 -U postgres -d geoportal -f .\db\init\001_schema.sql
psql -v ON_ERROR_STOP=1 -U postgres -d geoportal -f .\db\init\002_seed.sql
psql -v ON_ERROR_STOP=1 -U postgres -d geoportal -f .\db\init\003_geography_index.sql
```

Los scripts de Docker de la carpeta `docker-entrypoint-initdb.d` se aplican solo al crear un volumen nuevo. Para aplicar el esquema y las semillas a una base ya levantada:

```powershell
npm run db:migrate
npm run db:seed
```

No uses las credenciales de clase fuera de tu PC. El puerto de Docker se publica solo en `127.0.0.1`.

## 6. Variables de entorno

```powershell
Copy-Item .env.example .env
```

`.env.example` documenta qué variables necesita el backend. `.env` guarda los valores de tu PC y está excluido de Git. Para Docker, conserva los valores de ejemplo:

```dotenv
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=5434
DB_NAME=geoportal
DB_USER=geoportal
DB_PASSWORD=geoportal_clase_2026
```

Si usas PostgreSQL local, cambia puerto, usuario y contraseña según tu instalación. No copies una contraseña real a `AGENTS.md`, la spec ni un prompt de IA.

## 7. Levanta backend y visor

```powershell
npm run dev
```

El comando inicia Express en **http://localhost:3001** y Vite en **http://localhost:5174**. Abre `http://localhost:5174` en el navegador. Vite redirige las peticiones `/api` al backend, por eso el frontend usa rutas relativas y no necesita CORS en desarrollo.

Si quieres estudiar cada proceso por separado, usa dos terminales: `npm run dev:api` y `npm run dev:web`.

## 8. Prueba el backend antes del mapa

En otra ventana de PowerShell:

```powershell
Invoke-RestMethod http://localhost:3001/api/salud
Invoke-RestMethod http://localhost:3001/api/listo
Invoke-RestMethod http://localhost:3001/api/lugares
Invoke-RestMethod http://localhost:3001/api/lugares/geojson | ConvertTo-Json -Depth 8
```

`/api/salud` comprueba que Express responde. `/api/listo` prueba además la conexión a PostgreSQL. La lista JSON ofrece campos cómodos para una aplicación; `/geojson` ofrece una `FeatureCollection` para el mapa.

Para crear un lugar:

```powershell
$nuevo = @{
  nombre = 'Museo de práctica'
  categoria = 'cultura'
  descripcion = 'Agregado desde PowerShell'
  longitud = -77.031
  latitud = -12.057
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/api/lugares -Method Post -ContentType 'application/json' -Body $nuevo
```

La respuesta 201 incluye un `id` y una cabecera `Location`. Para filtrar: `http://localhost:3001/api/lugares/geojson?categoria=cultura`.

Para buscar lugares cercanos al centro indicado, con radio de 2000 **metros**:

```powershell
Invoke-RestMethod 'http://localhost:3001/api/lugares/cercanos?lon=-77.037&lat=-12.065&radio=2000' | ConvertTo-Json -Depth 8
```

La consulta usa PostGIS `ST_DWithin` y calcula `distancia_m`. El backend convierte la geometría a `geography` para medir en metros. Revisa el contrato completo en la [spec](specs/001-geoportal-mvp.md).

## 9. Usa el geoportal

1. Abre `http://localhost:5174`.
2. Selecciona **Cultura** en el filtro y observa cómo cambia la capa.
3. Haz clic en un espacio libre del mapa: las coordenadas aparecen en el formulario.
4. Escribe un nombre nuevo y pulsa **Guardar en PostGIS**.
5. Abre el popup del punto recién creado.
6. Centra el mapa sobre otra zona y pulsa **A 2 km**.

Los puntos se colorean por categoría. La búsqueda por radio trabaja respecto del **centro actual del mapa**, restablece el filtro a **Todas** y muestra distancias en metros. Cambiar categoría o pulsar **Actualizar** vuelve a la consulta general. El mapa base necesita Internet; la lista consulta la API incluso mientras carga el mapa. Si falla una consulta, se conservan los resultados anteriores y se muestra el error.

Un registro correcto emite un sonido breve; puedes desactivar **Sonido al guardar**. El panel y los resultados aparecen mediante deslizamiento suave. Las animaciones respetan la preferencia de movimiento reducido del dispositivo.

## 10. Qué contiene cada archivo

| Archivo o carpeta | Cómo prepararlo y qué hace |
| --- | --- |
| `package.json` | Define una instalación y los comandos `dev`, `test`, `build`, `db:migrate`, `db:seed`. |
| `compose.yaml` | Fija imagen PostGIS, credenciales de clase, puerto local, volumen y SQL inicial. |
| `db/init/001_schema.sql` | Crea extensión, tabla `lugares` y índices. Cambios de esquema futuros deben ir en otro SQL versionado. |
| `db/init/002_seed.sql` | Inserta ejemplos repetibles; `ON CONFLICT` evita duplicados. |
| `db/init/003_geography_index.sql` | Añade el índice GIST de `geom::geography` usado por las búsquedas en metros. |
| `backend/config.js` | Lee y valida variables del entorno. |
| `backend/db.js` | Crea la conexión Sequelize al dialecto PostgreSQL. |
| `backend/model.js` | Representa `lugares` y `geometry(Point,4326)` sin alterar el esquema. |
| `backend/domain.js` | Valida entradas y convierte filas a DTO y GeoJSON. |
| `backend/repository.js` | Lee/escribe con Sequelize y ejecuta la consulta espacial parametrizada. |
| `backend/app.js` | Define rutas, códigos HTTP y errores. Acepta un repositorio inyectado para probar sin base. |
| `backend/server.js` | Verifica la base e inicia Express. |
| `vite.config.js` | Conecta Tailwind, usa `frontend/` como raíz y redirige `/api` a Express. |
| `frontend/index.html` | Contiene mapa, filtro, lista y formulario. |
| `frontend/src/main.js` | Consume la API, dibuja MapLibre, captura clics y envía POST. |
| `frontend/src/consultas.js` | Descarta respuestas desactualizadas y normaliza longitudes. |
| `frontend/src/mapas-base.js` | Catálogo de mapas base (OpenFreeMap, OpenStreetMap, Google y Esri) y construcción de estilos MapLibre. |
| `frontend/src/sonido.js` | Emite una confirmación breve tras guardar, sin descargar archivos de audio. |
| `frontend/src/style.css` | Importa Tailwind y define el tamaño/responsividad del mapa. |
| `test/` | Verifica validación, GeoJSON y contrato HTTP. |
| `integration/postgis.test.js` | Verifica SQL, modelo y API con PostGIS real en un esquema temporal. |
| `AGENTS.md`, `PLANS.md`, `specs/`, `tasks/`, `.agents/skills/`, `.codex/agents/` | Conservan el método de trabajo con IA, los agentes especializados y los criterios verificables. |

## 11. Verifica y prepara una versión compilada

```powershell
npm test
npm run build
npm start
```

Después del build, Express sirve el frontend compilado en `http://localhost:3001`. Para revisar cada criterio de aceptación con datos reales, sigue [Verificación](docs/03_VERIFICACION.md).

Con la base disponible y `.env` configurado, ejecuta también:

```powershell
npm run test:postgis
```

La prueba crea un esquema temporal con migraciones y semillas, recorre los endpoints y elimina ese esquema al terminar. Requiere PostGIS ya instalado y permisos de creación de esquemas; no modifica `public.lugares`.

La comprobación realizada en este equipo y los comandos para reiniciar su instancia local están en [Verificación de la entrega](docs/03_VERIFICACION.md#verificación-de-la-entrega-2026-09-19).

## 12. Si algo falla

- Si Express informa `ECONNREFUSED`, revisa que PostGIS esté en marcha y que el puerto de `.env` sea 5434 con Docker.
- Si aparece `relation "lugares" does not exist`, ejecuta `npm run db:migrate` y `npm run db:seed`.
- Si el navegador abre la interfaz pero no carga lugares, comprueba `http://localhost:3001/api/listo` y el proxy de `vite.config.js`.
- Si el mapa queda gris, revisa la conexión a Internet y la consola del navegador. Las respuestas de la API siguen disponibles.
- Si aparece un 409 al crear, cambia el nombre: el ejemplo lo exige único.

## Referencias

- [Prácticas oficiales de Codex para AGENTS.md y planificación](https://developers.openai.com/es-419/guides/best-practices)
- [Skills locales de Codex](https://developers.openai.com/es-419/docs/build-skills)
- [Agentes personalizados de Codex](https://developers.openai.com/codex/subagents)
- [Sequelize GEOMETRY](https://sequelize.org/api/v6/class/src/data-types.js~geometry)
- [MapLibre GL JS con Vite](https://maplibre.org/maplibre-gl-js/docs/)
- [Requisitos de Node.js de Vite](https://vite.dev/guide/)
- [Tailwind CSS con Vite](https://tailwindcss.com/docs/installation/using-vite)
