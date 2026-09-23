INSERT INTO lugares (nombre, categoria, descripcion, geom) VALUES
  ('Biblioteca Nacional del Perú', 'cultura', 'Sede de San Borja', ST_SetSRID(ST_MakePoint(-77.0035, -12.0863), 4326)),
  ('Hospital Nacional Arzobispo Loayza', 'salud', 'Centro de salud de referencia', ST_SetSRID(ST_MakePoint(-77.0416, -12.0496), 4326)),
  ('Universidad Nacional Federico Villarreal', 'educacion', 'Punto de práctica para el geoportal', ST_SetSRID(ST_MakePoint(-77.0359, -12.0611), 4326))
ON CONFLICT (nombre) DO NOTHING;
