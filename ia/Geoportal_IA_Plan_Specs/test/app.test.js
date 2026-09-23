import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { crearApp } from '../backend/app.js';
import { aDto } from '../backend/domain.js';

async function iniciar(t, overrides = {}) {
  const datos = [{ id: 1, nombre: 'Biblioteca', categoria: 'cultura', descripcion: null, geom: { type: 'Point', coordinates: [-77.03, -12.05] } }];
  const llamadas = { crear: 0, listar: 0, obtener: 0, cercanos: [] };
  const repository = {
    comprobarBase: async () => {},
    listar: async ({ categoria }) => {
      llamadas.listar++;
      return datos.filter((x) => !categoria || x.categoria === categoria).map(aDto);
    },
    obtener: async (id) => {
      llamadas.obtener++;
      const dato = datos.find((x) => String(x.id) === id);
      return dato ? aDto(dato) : null;
    },
    crear: async (valor) => {
      llamadas.crear++;
      if (datos.some((x) => x.nombre === valor.nombre)) throw Object.assign(new Error('SQL privado'), { name: 'SequelizeUniqueConstraintError' });
      const nuevo = { id: datos.length + 1, ...valor };
      datos.push(nuevo);
      return aDto(nuevo);
    },
    cercanos: async (consulta) => { llamadas.cercanos.push(consulta); return [{ ...aDto(datos[0]), distancia_m: 123.4 }]; },
    ...overrides,
  };
  const server = crearApp(repository).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const pedir = (path, options) => fetch(`${base}${path}`, options);
  const post = (body) => pedir('/api/lugares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { pedir, post, datos, llamadas };
}

test('salud y disponibilidad de base responden 200', async (t) => {
  const { pedir } = await iniciar(t);
  assert.deepEqual(await (await pedir('/api/salud')).json(), { estado: 'ok' });
  const listo = await pedir('/api/listo');
  assert.equal(listo.status, 200);
  assert.deepEqual(await listo.json(), { base: 'conectada' });
});

test('CA01: GeoJSON, orden de coordenadas y filtros de ambas lecturas', async (t) => {
  const { pedir } = await iniciar(t);
  const res = await pedir('/api/lugares/geojson');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/geo\+json/);
  assert.deepEqual((await res.json()).features[0].geometry.coordinates, [-77.03, -12.05]);
  assert.equal((await (await pedir('/api/lugares?categoria=cultura')).json()).length, 1);
  assert.deepEqual(await (await pedir('/api/lugares?categoria=salud')).json(), []);
  assert.deepEqual((await (await pedir('/api/lugares/geojson?categoria=salud')).json()).features, []);
});

test('CA02 y CA05: POST 201, Location consultable y aparición en GeoJSON', async (t) => {
  const { pedir, post } = await iniciar(t);
  const res = await post({ nombre: ' Centro cultural ', categoria: 'cultura', longitud: -77.04, latitud: -12.06 });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('location'), '/api/lugares/2');
  const creado = await res.json();
  assert.equal(creado.nombre, 'Centro cultural');
  const consulta = await pedir(res.headers.get('location'));
  assert.equal(consulta.status, 200);
  assert.deepEqual(await consulta.json(), creado);
  const coleccion = await (await pedir('/api/lugares/geojson')).json();
  assert.deepEqual(coleccion.features.find((f) => f.id === creado.id).geometry.coordinates, [-77.04, -12.06]);
});

test('CA03: POST inválido no llega al repositorio ni crea registro', async (t) => {
  const { post, pedir, llamadas, datos } = await iniciar(t);
  for (const body of [null, [], 'texto', 1, {},
    { nombre: 'Error', categoria: 'otro', longitud: -77, latitud: 100 },
    { nombre: 'Error\0', categoria: 'otro', longitud: -77, latitud: -12 },
  ]) {
    const res = await post(body);
    assert.equal(res.status, 422);
    assert.match(res.headers.get('content-type'), /application\/problem\+json/);
    assert.equal((await res.json()).status, 422);
  }
  assert.equal((await pedir('/api/lugares', { method: 'POST' })).status, 422);
  assert.equal(llamadas.crear, 0);
  assert.equal(datos.length, 1);
});

test('CA04: categoría desconocida o repetida produce 400 antes de consultar', async (t) => {
  const { pedir, llamadas } = await iniciar(t);
  for (const ruta of ['/api/lugares', '/api/lugares/geojson']) {
    for (const query of ['categoria=desconocida', 'categoria=cultura&categoria=salud']) {
      assert.equal((await pedir(`${ruta}?${query}`)).status, 400);
    }
  }
  assert.equal(llamadas.listar, 0);
});

test('ids inválidos son 400, y recursos o rutas ausentes son 404', async (t) => {
  const { pedir, llamadas } = await iniciar(t);
  for (const id of ['0', '-1', '1.5', 'abc', '01', '9223372036854775808', '9'.repeat(60)]) {
    assert.equal((await pedir(`/api/lugares/${id}`)).status, 400);
  }
  assert.equal(llamadas.obtener, 0);
  assert.equal((await pedir('/api/lugares/999')).status, 404);
  assert.equal((await pedir('/api/no-existe')).status, 404);
});

test('cercanos pasa metros al repositorio y devuelve distancia en GeoJSON', async (t) => {
  const { pedir, llamadas } = await iniciar(t);
  for (const radio of ['2000', '0.5', '50000']) {
    const res = await pedir(`/api/lugares/cercanos?lon=-77.03&lat=-12.05&radio=${radio}`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/geo\+json/);
    assert.equal((await res.json()).features[0].properties.distancia_m, 123.4);
    assert.deepEqual(llamadas.cercanos.at(-1), { longitud: -77.03, latitud: -12.05, radio: Number(radio) });
  }
});

test('consulta espacial inválida no llega al repositorio', async (t) => {
  const { pedir, llamadas } = await iniciar(t);
  for (const query of ['', 'lon=0&lat=0&radio=0', 'lon=0&lat=91&radio=2000', 'lon=0&lat=0&radio=50001', 'lon=0&lat=0&radio=1&radio=2', 'lon=0&lat=0&radio=0x10']) {
    assert.equal((await pedir(`/api/lugares/cercanos?${query}`)).status, 400);
  }
  assert.equal(llamadas.cercanos.length, 0);
});

test('nombre duplicado es 409 y no expone el error SQL', async (t) => {
  const { post } = await iniciar(t);
  const res = await post({ nombre: 'Biblioteca', categoria: 'otro', longitud: 0, latitud: 0 });
  assert.equal(res.status, 409);
  assert.doesNotMatch(await res.text(), /SQL privado/);
});

test('JSON mal formado, demasiado grande o de codificación no admitida es 400', async (t) => {
  const { pedir, llamadas } = await iniciar(t);
  for (const [body, type] of [['{"nombre":', 'application/json'], [JSON.stringify({ nombre: 'a'.repeat(33000) }), 'application/json'], ['{}', 'application/json; charset=iso-8859-1']]) {
    const res = await pedir('/api/lugares', { method: 'POST', headers: { 'Content-Type': type }, body });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).status, 400);
  }
  assert.equal(llamadas.crear, 0);
});

test('fallos de base producen 500 sin SQL ni credenciales', async (t) => {
  const fallar = async () => { throw new Error('SELECT password=secreto FROM lugares'); };
  t.mock.method(console, 'error', () => {});
  const { pedir } = await iniciar(t, { listar: fallar, comprobarBase: fallar });
  for (const ruta of ['/api/listo', '/api/lugares']) {
    const res = await pedir(ruta);
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { type: 'about:blank', title: 'Error interno', status: 500, detail: 'Revisa el registro del servidor.' });
  }
});
