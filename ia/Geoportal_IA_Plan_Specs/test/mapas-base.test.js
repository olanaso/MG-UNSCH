import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPAS_BASE, MAPA_BASE_INICIAL, aplicarMapaBase, estiloDe, estiloRaster } from '../frontend/src/mapas-base.js';

function mapaFalso() {
  const llamadas = [];
  return { llamadas, setStyle: (estilo, opciones) => llamadas.push({ estilo, opciones }) };
}

test('el catálogo ofrece OpenStreetMap, Google y Esri con identificadores únicos', () => {
  const identificadores = MAPAS_BASE.map((mapa) => mapa.id);
  assert.equal(new Set(identificadores).size, identificadores.length);
  assert.ok(identificadores.includes('openstreetmap'));
  assert.ok(identificadores.some((id) => id.startsWith('google-')));
  assert.ok(identificadores.filter((id) => id.startsWith('esri-')).length >= 2);
  assert.ok(identificadores.includes(MAPA_BASE_INICIAL));
  for (const mapa of MAPAS_BASE) assert.ok(mapa.nombre.length > 0);
});

test('cada mapa base raster produce un estilo válido con atribución', () => {
  for (const { id } of MAPAS_BASE) {
    const estilo = estiloDe(id);
    if (typeof estilo === 'string') {
      assert.ok(estilo.startsWith('https://'));
      continue;
    }
    assert.equal(estilo.version, 8);
    const fuente = estilo.sources['mapa-base'];
    assert.equal(fuente.type, 'raster');
    assert.equal(estilo.layers.length, 1);
    assert.equal(estilo.layers[0].source, 'mapa-base');
    assert.ok(fuente.attribution.length > 0);
    for (const tesela of fuente.tiles) {
      assert.ok(tesela.startsWith('https://'), `${id} debe usar HTTPS`);
      for (const marcador of ['{z}', '{x}', '{y}']) {
        assert.ok(tesela.includes(marcador), `${id} necesita ${marcador}`);
      }
    }
  }
});

test('Esri usa el orden de teselas {z}/{y}/{x} de ArcGIS', () => {
  const estilo = estiloDe('esri-satelite');
  assert.ok(estilo.sources['mapa-base'].tiles[0].endsWith('/{z}/{y}/{x}'));
});

test('cada identificador devuelve un estilo distinto de los demás', () => {
  const estilos = MAPAS_BASE.map((mapa) => JSON.stringify(estiloDe(mapa.id)));
  assert.equal(new Set(estilos).size, estilos.length);
});

test('el estilo se construye de nuevo en cada llamada', () => {
  const primero = estiloDe('openstreetmap');
  primero.sources['mapa-base'].tiles[0] = 'https://ejemplo.invalido/{z}/{x}/{y}.png';
  assert.notDeepEqual(estiloDe('openstreetmap'), primero);
});

test('CA01: elegir un mapa base reemplaza el estilo del mapa', () => {
  const mapa = mapaFalso();
  for (const { id } of MAPAS_BASE) aplicarMapaBase(mapa, id);
  assert.equal(mapa.llamadas.length, MAPAS_BASE.length);
  assert.deepEqual(mapa.llamadas[0].estilo, estiloDe(MAPAS_BASE[0].id));
  // Sin diff, MapLibre recarga el estilo y vuelve a emitir `style.load`.
  for (const llamada of mapa.llamadas) assert.equal(llamada.opciones.diff, false);
});

test('un mapa base desconocido falla sin tocar el mapa', () => {
  const mapa = mapaFalso();
  assert.throws(() => aplicarMapaBase(mapa, 'inexistente'), /Mapa base desconocido/);
  assert.equal(mapa.llamadas.length, 0);
});

test('estiloRaster copia las teselas recibidas', () => {
  const tiles = ['https://ejemplo.test/{z}/{x}/{y}.png'];
  const estilo = estiloRaster({ tiles, atribucion: 'Ejemplo', maxzoom: 18 });
  tiles.push('https://otro.test/{z}/{x}/{y}.png');
  assert.equal(estilo.sources['mapa-base'].tiles.length, 1);
  assert.equal(estilo.sources['mapa-base'].maxzoom, 18);
});
