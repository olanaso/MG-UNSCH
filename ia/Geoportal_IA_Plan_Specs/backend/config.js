import 'dotenv/config';

export function leerConfig(env = process.env) {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length) throw new Error(`Faltan variables en .env: ${missing.join(', ')}`);
  const puerto = (name, defaultValue) => {
    const value = env[name] ?? defaultValue;
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
      throw new Error(`${name} debe ser un puerto entero entre 1 y 65535.`);
    }
    return Number(value);
  };
  return {
    port: puerto('PORT', '3001'),
    database: {
      host: env.DB_HOST, port: puerto('DB_PORT'), name: env.DB_NAME,
      user: env.DB_USER, password: env.DB_PASSWORD,
    },
  };
}
