import test from 'node:test';
import assert from 'node:assert/strict';
import { aDto, aGeoJSON, validarCategoria, validarCercanos, validarId, validarNuevoLugar } from '../backend/domain.js';

const valido = { nombre: '  Museo  ', categoria: 'cultura', longitud: -77.03, latitud: -12.05 };

test('normaliza nombre y convierte la entrada en Point [longitud, latitud]', () => {
  const { valor, errores } = validarNuevoLugar(valido);
  assert.deepEqual(errores, []);
  assert.deepEqual(valor, { nombre: 'Museo', categoria: 'cultura', descripcion: null, geom: { type: 'Point', coordinates: [-77.03, -12.05] } });
});

test('acepta los límites de coordenadas y longitudes de texto', () => {
  for (const [longitud, latitud] of [[-180, -90], [180, 90], [0, 0]]) {
    assert.deepEqual(validarNuevoLugar({ ...valido, nombre: 'a'.repeat(120), descripcion: 'b'.repeat(500), longitud, latitud }).errores, []);
  }
});

test('rechaza tipos, campos ausentes, textos largos y coordenadas inválidas', () => {
  for (const body of [null, undefined, [], true, 'texto', 12]) assert.ok(validarNuevoLugar(body).errores.length);
  for (const cambio of [
    { nombre: '' }, { nombre: '   ' }, { nombre: 123 }, { nombre: 'a'.repeat(121) },
    { nombre: 'a\0b' }, { descripcion: 'a\0b' },
    { categoria: 'inventada' }, { categoria: ['salud'] }, { descripcion: false }, { descripcion: 'b'.repeat(501) },
    { longitud: '0' }, { longitud: null }, { longitud: Infinity }, { longitud: 181 },
    { latitud: NaN }, { latitud: -91 }, { latitud: 100 }, { latitud: undefined },
  ]) {
    const resultado = validarNuevoLugar({ ...valido, ...cambio });
    assert.ok(resultado.errores.length, JSON.stringify(cambio));
    assert.equal(resultado.valor, null);
  }
});

test('filtros opcionales y categorías admitidas', () => {
  for (const categoria of [undefined, '', 'salud', 'educacion', 'cultura', 'otro']) {
    assert.deepEqual(validarCategoria(categoria).errores, []);
  }
  for (const categoria of [null, 'Cultura', 'inventada', ['salud', 'cultura']]) assert.ok(validarCategoria(categoria).errores.length);
});

test('radio en metros admite fracciones, límites y notación científica', () => {
  for (const radio of ['0.5', '2000', '50000', '2e3']) {
    const result = validarCercanos({ lon: '-77.03', lat: '-12.05', radio });
    assert.deepEqual(result.errores, []);
    assert.equal(result.valor.radio, Number(radio));
  }
});

test('consulta espacial rechaza ausencias, repeticiones y números inválidos', () => {
  for (const cambio of [
    { radio: '0' }, { radio: '-1' }, { radio: '50000.01' }, { radio: 'Infinity' },
    { radio: '' }, { radio: ' ' }, { radio: '0x10' }, { radio: ['2', '3'] },
    { lon: undefined }, { lon: '181' }, { lon: '-181' }, { lat: '-91' }, { lat: '1; DROP TABLE lugares' },
  ]) assert.ok(validarCercanos({ lon: '-77', lat: '-12', radio: '2000', ...cambio }).errores.length);
});

test('ids positivos dentro de BIGINT sin conversiones imprecisas', () => {
  for (const id of ['1', '42', '9223372036854775807']) assert.equal(validarId(id), true);
  for (const id of ['0', '-1', '01', '1.5', '1e2', 'abc', '9223372036854775808', '9'.repeat(100)]) assert.equal(validarId(id), false);
});

test('DTO y GeoJSON conservan coordenadas, valores nulos y distancia numérica', () => {
  const row = { id: '7', nombre: 'Museo', categoria: 'cultura', descripcion: null, geom: { type: 'Point', coordinates: [-77.03, -12.05] }, distancia_m: '250.5' };
  const dto = aDto({ toJSON: () => row });
  assert.equal(dto.distancia_m, 250.5);
  assert.deepEqual(aGeoJSON([row]), aGeoJSON([dto]));
  assert.deepEqual(aGeoJSON([dto]).features[0], {
    type: 'Feature', id: 7, geometry: { type: 'Point', coordinates: [-77.03, -12.05] },
    properties: { nombre: 'Museo', categoria: 'cultura', descripcion: null, distancia_m: 250.5 },
  });
  assert.deepEqual(aGeoJSON([]), { type: 'FeatureCollection', features: [] });
});
