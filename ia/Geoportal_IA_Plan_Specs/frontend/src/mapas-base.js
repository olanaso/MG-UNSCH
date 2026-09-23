// Catálogo de mapas base del visor. Cada entrada produce un estilo de MapLibre:
// una URL de estilo vectorial o un estilo raster construido con teselas XYZ.
// Las teselas de Google provienen de un extremo no documentado; en clase sirve
// para comparar proveedores, pero un despliegue público necesita la API oficial
// de Google Maps Tiles con clave y aceptar sus condiciones de uso.
const CATALOGO = [
  {
    id: 'openfreemap',
    nombre: 'OpenFreeMap Bright (vectorial)',
    url: 'https://tiles.openfreemap.org/styles/bright',
  },
  {
    id: 'openstreetmap',
    nombre: 'OpenStreetMap',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    atribucion: '© colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxzoom: 19,
  },
  {
    id: 'google-calles',
    nombre: 'Google Maps (calles)',
    tiles: [0, 1, 2, 3].map((n) => `https://mt${n}.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}`),
    atribucion: '© Google',
    maxzoom: 20,
  },
  {
    id: 'google-satelite',
    nombre: 'Google Maps (satélite)',
    tiles: [0, 1, 2, 3].map((n) => `https://mt${n}.google.com/vt/lyrs=s&hl=es&x={x}&y={y}&z={z}`),
    atribucion: '© Google',
    maxzoom: 20,
  },
  // ArcGIS Online invierte el orden: {z}/{y}/{x}.
  {
    id: 'esri-satelite',
    nombre: 'Esri World Imagery (satélite)',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    atribucion: 'Imágenes © Esri, Maxar, Earthstar Geographics',
    maxzoom: 19,
  },
  {
    id: 'esri-calles',
    nombre: 'Esri World Street Map',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
    atribucion: '© Esri y colaboradores',
    maxzoom: 19,
  },
  {
    id: 'esri-topografico',
    nombre: 'Esri World Topographic Map',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    atribucion: '© Esri y colaboradores',
    maxzoom: 19,
  },
];

export const MAPA_BASE_INICIAL = 'openfreemap';

// Solo identificador y nombre: la interfaz no necesita conocer las teselas.
export const MAPAS_BASE = CATALOGO.map(({ id, nombre }) => ({ id, nombre }));

export function estiloRaster({ tiles, atribucion, maxzoom = 19 }) {
  return {
    version: 8,
    sources: {
      'mapa-base': {
        type: 'raster',
        tiles: [...tiles],
        tileSize: 256,
        maxzoom,
        attribution: atribucion,
      },
    },
    layers: [{ id: 'mapa-base', type: 'raster', source: 'mapa-base' }],
  };
}

// Devuelve un estilo nuevo en cada llamada: MapLibre modifica el objeto que recibe.
export function estiloDe(id) {
  const entrada = CATALOGO.find((mapa) => mapa.id === id);
  if (!entrada) throw new Error(`Mapa base desconocido: ${id}`);
  return entrada.url ?? estiloRaster(entrada);
}

// CA01: elegir un mapa base reemplaza el estilo del mapa. `diff: false` fuerza
// una carga completa, de modo que `style.load` siempre vuelve a crear la capa
// de lugares. Un identificador desconocido no toca el mapa.
export function aplicarMapaBase(mapa, id) {
  const estilo = estiloDe(id);
  mapa.setStyle(estilo, { diff: false });
  return estilo;
}
