import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { aGeoJSON, validarCategoria, validarCercanos, validarId, validarNuevoLugar } from './domain.js';

const distDir = fileURLToPath(new URL('../dist/frontend/', import.meta.url));

function problema(res, status, title, detail) {
  return res.status(status).type('application/problem+json').json({
    type: 'about:blank', title, status, detail,
  });
}

export function crearApp(repository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb', strict: false }));
  if (existsSync(distDir)) app.use(express.static(distDir));

  app.get('/api/salud', (_req, res) => res.json({ estado: 'ok' }));
  app.get('/api/listo', async (_req, res) => {
    await repository.comprobarBase();
    res.json({ base: 'conectada' });
  });
  app.get('/api/lugares/geojson', async (req, res) => {
    const filtro = validarCategoria(req.query.categoria);
    if (filtro.errores.length) return problema(res, 400, 'Consulta inválida', filtro.errores.join(' '));
    return res.type('application/geo+json').json(aGeoJSON(await repository.listar({ categoria: filtro.valor })));
  });
  app.get('/api/lugares/cercanos', async (req, res) => {
    const consulta = validarCercanos(req.query);
    if (consulta.errores.length) return problema(res, 400, 'Consulta inválida', consulta.errores.join(' '));
    return res.type('application/geo+json').json(aGeoJSON(await repository.cercanos(consulta.valor)));
  });
  app.get('/api/lugares', async (req, res) => {
    const filtro = validarCategoria(req.query.categoria);
    if (filtro.errores.length) return problema(res, 400, 'Consulta inválida', filtro.errores.join(' '));
    return res.json(await repository.listar({ categoria: filtro.valor }));
  });
  app.get('/api/lugares/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
      return problema(res, 400, 'Id inválido', 'El id debe ser un entero entre 1 y 9223372036854775807.');
    }
    const lugar = await repository.obtener(req.params.id);
    if (!lugar) return problema(res, 404, 'Lugar no encontrado', 'No existe ese id.');
    return res.json(lugar);
  });
  app.post('/api/lugares', async (req, res) => {
    const nuevo = validarNuevoLugar(req.body);
    if (nuevo.errores.length) return problema(res, 422, 'Datos inválidos', nuevo.errores.join(' '));
    const lugar = await repository.crear(nuevo.valor);
    return res.status(201).location(`/api/lugares/${lugar.id}`).json(lugar);
  });
  app.use((req, res) => problema(res, 404, 'Ruta no encontrada', req.path));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return problema(res, 400, 'JSON inválido', 'Revisa la sintaxis del cuerpo JSON.');
    }
    if (error.type === 'entity.too.large') {
      return problema(res, 400, 'Cuerpo demasiado grande', 'El cuerpo JSON no debe superar 32 KiB.');
    }
    if (['encoding.unsupported', 'charset.unsupported', 'request.aborted', 'request.size.invalid'].includes(error.type)
        || error instanceof URIError) {
      return problema(res, 400, 'Petición inválida', 'Revisa la codificación y el contenido de la petición.');
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return problema(res, 409, 'Nombre duplicado', 'Ya existe un lugar con ese nombre.');
    }
    console.error(error);
    return problema(res, 500, 'Error interno', 'Revisa el registro del servidor.');
  });
  return app;
}
