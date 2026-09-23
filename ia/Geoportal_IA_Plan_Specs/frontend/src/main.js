import { Map, Marker, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { crearCargador, normalizarLongitud } from './consultas.js';
import { MAPAS_BASE, MAPA_BASE_INICIAL, aplicarMapaBase, estiloDe } from './mapas-base.js';
import { crearSonidoConfirmacion } from './sonido.js';
import './style.css';

setWorkerUrl(workerUrl);
const estado = document.querySelector('#estado');
const estadoMapa = document.querySelector('#estado-mapa');
const filtro = document.querySelector('#filtro');
const lista = document.querySelector('#lista');
const form = document.querySelector('#formulario');
const guardar = document.querySelector('#guardar');
const cercanos = document.querySelector('#cercanos');
const selectorBase = document.querySelector('#mapa-base');
const sonidoActivo = document.querySelector('#sonido');
const sonido = crearSonidoConfirmacion();
let geojsonActual = { type: 'FeatureCollection', features: [] };
let marcadorBorrador = null;
let popup = null;
let guardando = false;
for (const { id, nombre } of MAPAS_BASE) {
  const opcion = document.createElement('option');
  opcion.value = id;
  opcion.textContent = nombre;
  selectorBase.append(opcion);
}
selectorBase.value = MAPA_BASE_INICIAL;
const mapa = new Map({
  container: 'mapa', style: estiloDe(MAPA_BASE_INICIAL),
  center: [-77.037, -12.065], zoom: 11,
});
mapa.addControl(new NavigationControl(), 'top-right');

function mensaje(texto, error = false) {
  estado.textContent = texto;
  estado.className = error
    ? 'rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800'
    : 'rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-900';
}

function crearPopup(feature) {
  const contenedor = document.createElement('div');
  const titulo = document.createElement('strong');
  titulo.textContent = feature.properties.nombre;
  const detalle = document.createElement('p');
  detalle.textContent = `${feature.properties.categoria} · ${feature.properties.descripcion || 'Sin descripción'}`;
  contenedor.append(titulo, detalle);
  if (feature.properties.distancia_m !== undefined) {
    const distancia = document.createElement('p');
    distancia.textContent = `Distancia: ${feature.properties.distancia_m} m`;
    contenedor.append(distancia);
  }
  return contenedor;
}

function abrirPopup(feature) {
  popup?.remove();
  popup = new Popup().setLngLat(feature.geometry.coordinates).setDOMContent(crearPopup(feature)).addTo(mapa);
}

function mostrarLista(features) {
  lista.replaceChildren();
  if (!features.length) {
    const vacio = document.createElement('li');
    vacio.textContent = 'No hay lugares para esta consulta.';
    vacio.className = 'text-slate-500';
    lista.append(vacio);
  }
  for (const feature of features) {
    const item = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-teal-50';
    const distancia = feature.properties.distancia_m;
    boton.textContent = `${feature.properties.nombre} · ${feature.properties.categoria}${distancia === undefined ? '' : ` · ${distancia} m`}`;
    boton.addEventListener('click', () => {
      mapa.flyTo({ center: feature.geometry.coordinates, zoom: 14 });
      abrirPopup(feature);
    });
    item.append(boton);
    lista.append(item);
  }
}

function mostrarDatos(geojson, texto) {
  geojsonActual = geojson;
  popup?.remove();
  mapa.getSource('lugares')?.setData(geojson);
  mostrarLista(geojson.features);
  mensaje(`${texto}: ${geojson.features.length} lugar(es)${geojson.features.length === 200 ? ' (límite de la consulta)' : ''}`);
}

const cargar = crearCargador(mostrarDatos, (texto) => mensaje(`No se pudo consultar: ${texto}`, true));
function actualizar() {
  mensaje('Consultando la API…');
  const params = new URLSearchParams();
  if (filtro.value) params.set('categoria', filtro.value);
  return cargar(`/api/lugares/geojson?${params}`, 'Consulta completa');
}

// Cambiar de mapa base reemplaza el estilo, así que la capa de lugares se vuelve
// a crear con los datos vigentes cada vez que un estilo termina de cargarse.
mapa.on('style.load', () => {
  mapa.addSource('lugares', { type: 'geojson', data: geojsonActual });
  mapa.addLayer({
    id: 'puntos', type: 'circle', source: 'lugares',
    paint: {
      'circle-radius': 9,
      'circle-color': ['match', ['get', 'categoria'], 'salud', '#dc2626', 'educacion', '#2563eb', 'cultura', '#7c3aed', '#0f766e'],
      'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff',
    },
  });
  cercanos.disabled = false;
  estadoMapa.textContent = 'Clic en el mapa: elegir coordenadas';
});

// Los escuchas por capa se registran una sola vez: MapLibre los resuelve por
// identificador y los ignora mientras la capa no exista.
mapa.on('click', 'puntos', (evento) => abrirPopup(evento.features[0]));
mapa.on('mouseenter', 'puntos', () => { mapa.getCanvas().style.cursor = 'pointer'; });
mapa.on('mouseleave', 'puntos', () => { mapa.getCanvas().style.cursor = ''; });

selectorBase.addEventListener('change', () => {
  estadoMapa.textContent = 'Cambiando el mapa base…';
  aplicarMapaBase(mapa, selectorBase.value);
});

mapa.on('click', (evento) => {
  if (guardando || !mapa.getLayer('puntos')) return;
  if (mapa.queryRenderedFeatures(evento.point, { layers: ['puntos'] }).length) return;
  const lng = normalizarLongitud(evento.lngLat.lng);
  const lat = evento.lngLat.lat;
  form.elements.longitud.value = lng.toFixed(6);
  form.elements.latitud.value = lat.toFixed(6);
  marcadorBorrador?.remove();
  marcadorBorrador = new Marker({ color: '#0f766e' }).setLngLat([lng, lat]).addTo(mapa);
  mensaje('Coordenadas seleccionadas. Completa el formulario.');
});
mapa.on('error', () => {
  estadoMapa.textContent = 'No se pudo cargar parte del mapa. Revisa tu conexión a Internet.';
});
document.querySelector('#actualizar').addEventListener('click', actualizar);
filtro.addEventListener('change', actualizar);
cercanos.addEventListener('click', () => {
  const centro = mapa.getCenter();
  filtro.value = '';
  const params = new URLSearchParams({ lon: String(normalizarLongitud(centro.lng)), lat: String(centro.lat), radio: '2000' });
  mensaje('Buscando a 2 km del centro…');
  cargar(`/api/lugares/cercanos?${params}`, 'A 2 km del centro');
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (guardando || !form.reportValidity()) return;
  if (sonidoActivo.checked) void sonido.preparar();
  const datos = new FormData(form);
  const body = {
    nombre: String(datos.get('nombre')).trim(), categoria: String(datos.get('categoria')),
    descripcion: String(datos.get('descripcion')).trim() || null,
    longitud: Number(datos.get('longitud')), latitud: Number(datos.get('latitud')),
  };
  guardando = true;
  guardar.disabled = true;
  mensaje('Guardando el lugar…');
  try {
    const respuesta = await fetch('/api/lugares', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.detail || `HTTP ${respuesta.status}`);
    if (sonidoActivo.checked) sonido.reproducir();
    const conservarSonido = sonidoActivo.checked;
    form.reset();
    sonidoActivo.checked = conservarSonido;
    marcadorBorrador?.remove();
    marcadorBorrador = null;
    filtro.value = '';
    mapa.flyTo({ center: [resultado.longitud, resultado.latitud], zoom: 14 });
    const consulta = await actualizar();
    if (consulta === 'error') {
      mensaje(`Guardado: ${resultado.nombre}. No se pudo actualizar la capa; pulsa Actualizar.`, true);
    } else if (consulta === 'ok') {
      const feature = {
        type: 'Feature', id: resultado.id,
        geometry: { type: 'Point', coordinates: [resultado.longitud, resultado.latitud] },
        properties: { nombre: resultado.nombre, categoria: resultado.categoria, descripcion: resultado.descripcion },
      };
      // El nuevo lugar se muestra incluso si la consulta alcanzó el límite de 200.
      if (!geojsonActual.features.some((item) => item.id === resultado.id)) {
        mostrarDatos({ type: 'FeatureCollection', features: [...geojsonActual.features.slice(0, 199), feature] }, 'Consulta completa');
      }
      abrirPopup(feature);
      mensaje(`Guardado: ${resultado.nombre}`);
      estado.classList.add('registro-confirmado');
    }
  } catch (error) {
    mensaje(`No se pudo guardar: ${error.message}`, true);
  } finally {
    guardando = false;
    guardar.disabled = false;
  }
});

actualizar();
