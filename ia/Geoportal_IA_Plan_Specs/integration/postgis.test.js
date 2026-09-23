import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import SequelizePackage from 'sequelize';
import { leerConfig } from '../backend/config.js';
import { crearRepository } from '../backend/repository.js';
import { crearApp } from '../backend/app.js';

const { Sequelize, QueryTypes } = SequelizePackage;

test('integración HTTP con PostGIS en un esquema aislado', async (t) => {
  const { database } = leerConfig();
  const options = { host: database.host, port: database.port, dialect: 'postgres', logging: false };
  const admin = new Sequelize(database.name, database.user, database.password, options);
  const schema = `geoportal_test_${randomUUID().replaceAll('-', '')}`;
  let db;
  let server;
  let creado = false;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.close();
    try {
      // Identificador generado internamente; nunca proviene del cliente HTTP.
      if (creado) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally { await admin.close(); }
  });
  await admin.authenticate();
  await admin.query(`CREATE SCHEMA "${schema}"`);
  creado = true;
  db = new Sequelize(database.name, database.user, database.password, {
    ...options,
    hooks: { afterConnect: (connection) => connection.query(`SET search_path TO "${schema}", public`) },
  });
  // PostGIS debe estar instalado en la base antes de ejecutar esta prueba.
  await admin.query('SELECT PostGIS_Version()');
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    for (const archivo of ['001_schema.sql', '002_seed.sql', '003_geography_index.sql']) {
      await db.query(await readFile(new URL(`../db/init/${archivo}`, import.meta.url), 'utf8'));
    }
  }
  const repository = crearRepository(db);
  server = crearApp(repository).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (path) => fetch(`${base}${path}`);
  const post = (body) => fetch(`${base}/api/lugares`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  await t.test('T02: SQL repetible, tres semillas, Point 4326 e índices GIST', async () => {
    const rows = await db.query('SELECT ST_SRID(geom) AS srid, GeometryType(geom) AS tipo FROM lugares', { type: QueryTypes.SELECT });
    assert.equal(rows.length, 3);
    assert.ok(rows.every((row) => row.srid === 4326 && row.tipo === 'POINT'));
    const indices = await db.query('SELECT indexdef FROM pg_indexes WHERE schemaname = $schema', { bind: { schema }, type: QueryTypes.SELECT });
    assert.ok(indices.some((row) => /USING gist \(geom\)/i.test(row.indexdef)));
    assert.ok(indices.some((row) => /USING gist .*geography/i.test(row.indexdef)));
  });

  await t.test('T03: salud y conexión real', async () => {
    assert.deepEqual(await (await get('/api/salud')).json(), { estado: 'ok' });
    assert.equal((await get('/api/listo')).status, 200);
  });

  await t.test('CA01: GeoJSON y filtro con semillas reales', async () => {
    const res = await get('/api/lugares/geojson?categoria=cultura');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/geo\+json/);
    const datos = await res.json();
    assert.equal(datos.features.length, 1);
    assert.deepEqual(datos.features[0].geometry.coordinates, [-77.0035, -12.0863]);
    assert.equal((await (await get('/api/lugares?categoria=salud')).json()).length, 1);
  });

  await t.test('CA02 y CA05: alta, persistencia, Location, GeoJSON y duplicado', async () => {
    const body = { nombre: 'Alta integral', categoria: 'otro', descripcion: 'Prueba real', longitud: -77.031, latitud: -12.057 };
    const res = await post(body);
    assert.equal(res.status, 201);
    const lugar = await res.json();
    assert.deepEqual(await (await get(res.headers.get('location'))).json(), lugar);
    const geometria = await db.query('SELECT ST_SRID(geom) AS srid, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM lugares WHERE id = $id', { bind: { id: lugar.id }, type: QueryTypes.SELECT });
    assert.deepEqual(geometria[0], { srid: 4326, lon: body.longitud, lat: body.latitud });
    const coleccion = await (await get('/api/lugares/geojson')).json();
    assert.ok(coleccion.features.some((f) => f.id === lugar.id));
    assert.equal((await post(body)).status, 409);
  });

  await t.test('CA03 y CA04: entradas inválidas no modifican la base', async () => {
    const antes = await repository.listar();
    assert.equal((await post({ nombre: 'Inválido', categoria: 'otro', longitud: -77, latitud: 100 })).status, 422);
    assert.equal((await get('/api/lugares?categoria=desconocida')).status, 400);
    assert.equal((await get('/api/lugares/9223372036854775808')).status, 400);
    assert.deepEqual(await repository.listar(), antes);
  });

  await t.test('CA06: incluye 1999 m, excluye 2001 m y ordena antes de redondear', async () => {
    // ST_Project sobre geography sitúa las muestras a distancias conocidas en metros.
    for (const [nombre, distancia] of [['Fuera', 2001], ['Dentro', 1999], ['Décima lejana', 10.049], ['Décima cercana', 10.041], ['Centro', 0]]) {
      await db.query(`INSERT INTO lugares(nombre, categoria, geom) VALUES ($nombre, 'otro',
        ST_Project(ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography, $distancia, 0)::geometry)`,
      { bind: { nombre, distancia } });
    }
    const res = await get('/api/lugares/cercanos?lon=0&lat=0&radio=2000');
    assert.equal(res.status, 200);
    const { features } = await res.json();
    assert.deepEqual(features.map((f) => f.properties.nombre), ['Centro', 'Décima cercana', 'Décima lejana', 'Dentro']);
    assert.deepEqual(features.map((f) => f.properties.distancia_m), [0, 10, 10, 1999]);
    const fraccion = await (await get('/api/lugares/cercanos?lon=0&lat=0&radio=0.5')).json();
    assert.deepEqual(fraccion.features.map((f) => f.properties.nombre), ['Centro']);
    assert.equal((await (await get('/api/lugares/cercanos?lon=80&lat=30&radio=2000')).json()).features.length, 0);
  });

  await t.test('las tres lecturas respetan el límite de 200 registros', async () => {
    await db.query(`INSERT INTO lugares(nombre, categoria, geom)
      SELECT 'Límite ' || n, 'otro', ST_SetSRID(ST_MakePoint(0, 0), 4326) FROM generate_series(1, 205) AS n`);
    assert.equal((await (await get('/api/lugares')).json()).length, 200);
    assert.equal((await (await get('/api/lugares/geojson')).json()).features.length, 200);
    assert.equal((await (await get('/api/lugares/cercanos?lon=0&lat=0&radio=2000')).json()).features.length, 200);
  });
});
