import test from 'node:test';
import assert from 'node:assert/strict';
import { crearSonidoConfirmacion } from '../frontend/src/sonido.js';

test('audio no disponible o bloqueado no impide continuar', async () => {
  for (const constructor of [null, class { constructor() { throw new Error('Audio bloqueado'); } },
    class { state = 'suspended'; async resume() { throw new Error('Gesto requerido'); } }]) {
    const sonido = crearSonidoConfirmacion(constructor);
    await assert.doesNotReject(() => sonido.preparar());
    assert.doesNotThrow(() => sonido.reproducir());
  }
});

test('preparar audio no emite sonido; la confirmación es breve y reutiliza el contexto', async () => {
  const inicios = [];
  const finales = [];
  let contextos = 0;
  class Contexto {
    state = 'suspended'; currentTime = 10; destination = {};
    constructor() { contextos++; }
    async resume() { this.state = 'running'; }
    createOscillator() {
      return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {},
        start(time) { inicios.push(time); }, stop(time) { finales.push(time); } };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
    }
  }
  const sonido = crearSonidoConfirmacion(Contexto);
  sonido.reproducir();
  await sonido.preparar();
  await sonido.preparar();
  assert.equal(contextos, 1);
  assert.deepEqual(inicios, []);
  sonido.reproducir();
  assert.equal(inicios.length, 2);
  assert.ok(finales.every((time) => time - 10 < 0.5));
});
