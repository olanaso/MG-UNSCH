const CATEGORIAS = new Set(['salud', 'educacion', 'cultura', 'otro']);
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

export function validarId(id) {
  return /^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n;
}

export function validarNuevoLugar(body) {
  const errores = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errores: ['El cuerpo debe ser un objeto JSON.'], valor: null };
  }
  const { nombre, categoria, descripcion = null, longitud, latitud } = body;
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 120 || nombre.includes('\0')) {
    errores.push('nombre debe tener entre 1 y 120 caracteres y no contener caracteres nulos.');
  }
  if (!CATEGORIAS.has(categoria)) errores.push('categoria debe ser salud, educacion, cultura u otro.');
  if (descripcion !== null && (typeof descripcion !== 'string' || descripcion.length > 500 || descripcion.includes('\0'))) {
    errores.push('descripcion debe ser texto de hasta 500 caracteres sin caracteres nulos, o null.');
  }
  if (typeof longitud !== 'number' || !Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
    errores.push('longitud debe ser un número entre -180 y 180.');
  }
  if (typeof latitud !== 'number' || !Number.isFinite(latitud) || latitud < -90 || latitud > 90) {
    errores.push('latitud debe ser un número entre -90 y 90.');
  }
  return {
    errores,
    valor: errores.length ? null : {
      nombre: nombre.trim(), categoria, descripcion,
      geom: { type: 'Point', coordinates: [longitud, latitud] },
    },
  };
}

export function validarCategoria(categoria) {
  if (categoria === undefined || categoria === '') return { valor: null, errores: [] };
  return CATEGORIAS.has(categoria)
    ? { valor: categoria, errores: [] }
    : { valor: null, errores: ['Categoría desconocida.'] };
}

export function validarCercanos(query) {
  const errores = [];
  const leer = (nombre, minimo, maximo) => {
    const bruto = query[nombre];
    const numero = typeof bruto === 'string' && DECIMAL.test(bruto.trim()) ? Number(bruto) : NaN;
    if (!Number.isFinite(numero) || numero < minimo || numero > maximo) {
      errores.push(`${nombre} debe estar entre ${minimo} y ${maximo}.`);
    }
    return numero;
  };
  const longitud = leer('lon', -180, 180);
  const latitud = leer('lat', -90, 90);
  const radio = leer('radio', 0, 50000);
  if (radio === 0) errores.push('radio debe ser mayor que 0 metros.');
  return { valor: { longitud, latitud, radio }, errores };
}

export function aDto(lugar) {
  const dato = typeof lugar.toJSON === 'function' ? lugar.toJSON() : lugar;
  return {
    id: Number(dato.id), nombre: dato.nombre, categoria: dato.categoria,
    descripcion: dato.descripcion,
    longitud: Number(dato.geom.coordinates[0]), latitud: Number(dato.geom.coordinates[1]),
    ...(dato.distancia_m === undefined ? {} : { distancia_m: Number(dato.distancia_m) }),
  };
}

export function aGeoJSON(lugares) {
  return {
    type: 'FeatureCollection',
    features: lugares.map((lugar) => {
      const dato = lugar.geom ? aDto(lugar) : lugar;
      return {
        type: 'Feature', id: dato.id,
        geometry: { type: 'Point', coordinates: [dato.longitud, dato.latitud] },
        properties: {
          nombre: dato.nombre, categoria: dato.categoria, descripcion: dato.descripcion,
          ...(dato.distancia_m === undefined ? {} : { distancia_m: dato.distancia_m }),
        },
      };
    }),
  };
}
