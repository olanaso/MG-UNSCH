import test from 'node:test';
import assert from 'node:assert/strict';
import { crearCargador, normalizarLongitud } from '../frontend/src/consultas.js';

test('una consulta anterior lenta no reemplaza los resultados más recientes', async () => {
  const pendientes = [];
  const mostrados = [];
  const errores = [];
  const cargar = crearCargador((datos) => mostrados.push(datos), (error) => errores.push(error),
    (_url, options) => new Promise((resolve) => pendientes.push({ resolve, signal: options.signal })));
  const anterior = cargar('/cultura');
  const actual = cargar('/salud');
  assert.equal(pendientes[0].signal.aborted, true);
  pendientes[1].resolve({ ok: true, json: async () => ['salud'] });
  assert.equal(await actual, 'ok');
  pendientes[0].resolve({ ok: true, json: async () => ['cultura'] });
  assert.equal(await anterior, 'cancelada');
  assert.deepEqual(mostrados, [['salud']]);
  assert.deepEqual(errores, []);
});

test('un error antiguo se ignora y un error actual se comunica', async () => {
  const pendientes = [];
  const errores = [];
  const cargar = crearCargador(() => assert.fail('No hay datos correctos'), (error) => errores.push(error),
    () => new Promise((resolve, reject) => pendientes.push({ resolve, reject })));
  const anterior = cargar('/anterior');
  const actual = cargar('/actual');
  pendientes[0].reject(new Error('cancelación antigua'));
  assert.equal(await anterior, 'cancelada');
  pendientes[1].resolve({ ok: false, json: async () => ({ detail: 'Base no disponible' }) });
  assert.equal(await actual, 'error');
  assert.deepEqual(errores, ['Base no disponible']);
});

test('normaliza coordenadas de otras copias del mundo', () => {
  assert.equal(normalizarLongitud(283), -77);
  assert.equal(normalizarLongitud(-437), -77);
  assert.equal(normalizarLongitud(180), -180);
  assert.ok(Math.abs(normalizarLongitud(-77.035) + 77.035) < 1e-10);
});
