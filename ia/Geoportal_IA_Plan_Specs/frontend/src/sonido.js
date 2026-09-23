export function crearSonidoConfirmacion(AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext) {
  let contexto;
  return {
    async preparar() {
      try {
        if (!AudioContextClass) return;
        contexto ??= new AudioContextClass();
        // Se llama desde el gesto de enviar el formulario, antes de esperar al POST.
        if (contexto.state === 'suspended') await contexto.resume();
      } catch { /* La falta de audio no impide registrar lugares. */ }
    },
    reproducir() {
      if (contexto?.state !== 'running') return;
      try {
        const inicio = contexto.currentTime;
        for (const [frecuencia, retraso] of [[660, 0], [880, 0.12]]) {
          const oscilador = contexto.createOscillator();
          const volumen = contexto.createGain();
          oscilador.type = 'sine';
          oscilador.frequency.setValueAtTime(frecuencia, inicio + retraso);
          volumen.gain.setValueAtTime(0, inicio + retraso);
          volumen.gain.linearRampToValueAtTime(0.08, inicio + retraso + 0.015);
          volumen.gain.exponentialRampToValueAtTime(0.001, inicio + retraso + 0.18);
          oscilador.connect(volumen);
          volumen.connect(contexto.destination);
          oscilador.onended = () => { oscilador.disconnect(); volumen.disconnect(); };
          oscilador.start(inicio + retraso);
          oscilador.stop(inicio + retraso + 0.2);
        }
      } catch { /* La confirmación visual sigue disponible. */ }
    },
  };
}
