// Una respuesta antigua nunca reemplaza una selección más reciente.
export function crearCargador(mostrar, informarError, fetchImpl = fetch) {
  let version = 0;
  let controller;
  return async (url, texto) => {
    const actual = ++version;
    controller?.abort();
    controller = new AbortController();
    try {
      const respuesta = await fetchImpl(url, { signal: controller.signal });
      const datos = await respuesta.json();
      if (actual !== version) return 'cancelada';
      if (!respuesta.ok) throw new Error(datos.detail || `HTTP ${respuesta.status}`);
      mostrar(datos, texto);
      return 'ok';
    } catch (error) {
      if (actual !== version) return 'cancelada';
      informarError(error.message);
      return 'error';
    }
  };
}

export function normalizarLongitud(longitud) {
  return ((longitud + 180) % 360 + 360) % 360 - 180;
}
