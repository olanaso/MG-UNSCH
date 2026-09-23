import { config, sequelize } from './db.js';
import { crearRepository } from './repository.js';
import { crearApp } from './app.js';

try {
  await sequelize.authenticate();
  const app = crearApp(crearRepository(sequelize));
  const server = app.listen(config.port, '127.0.0.1', () => {
    console.log(`Geoportal/API: http://localhost:${config.port}`);
    console.log('Frontend en desarrollo: http://localhost:5174');
  });
  server.on('error', async (error) => {
    console.error(`No se pudo escuchar en el puerto ${config.port}: ${error.code}`);
    await sequelize.close();
    process.exitCode = 1;
  });
  const cerrar = () => server.close(() => sequelize.close());
  process.once('SIGINT', cerrar);
  process.once('SIGTERM', cerrar);
} catch (error) {
  console.error('No se pudo iniciar: ', error.message);
  await sequelize.close();
  process.exitCode = 1;
}
