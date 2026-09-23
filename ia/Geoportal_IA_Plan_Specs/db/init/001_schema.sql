CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS lugares (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('salud', 'educacion', 'cultura', 'otro')),
  descripcion VARCHAR(500),
  geom geometry(Point, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS lugares_geom_gix ON lugares USING GIST (geom);
CREATE INDEX IF NOT EXISTS lugares_categoria_idx ON lugares (categoria);
