import test from 'node:test';
import assert from 'node:assert/strict';
import { leerConfig } from '../backend/config.js';

const env = { DB_HOST: '127.0.0.1', DB_PORT: '5434', DB_NAME: 'geoportal', DB_USER: 'geoportal', DB_PASSWORD: 'solo-test' };

test('configuración exige conexión y valida puertos antes de iniciar', () => {
  assert.equal(leerConfig(env).port, 3001);
  assert.equal(leerConfig(env).database.port, 5434);
  assert.throws(() => leerConfig({}), /Faltan variables/);
  for (const nombre of ['PORT', 'DB_PORT']) {
    for (const valor of ['', '0', '-1', '65536', '1.5', 'abc', 'Infinity']) {
      assert.throws(() => leerConfig({ ...env, [nombre]: valor }), new RegExp(nombre));
    }
  }
});
