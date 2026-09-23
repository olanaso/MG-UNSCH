-- ST_DWithin en metros consulta esta expresión, no el índice de geometry.
CREATE INDEX IF NOT EXISTS lugares_geography_gix
  ON lugares USING GIST ((geom::geography));
