// Instalar el Node.js
// Inicialializar un proyecto con "npm init"
// Instalar el express con "npm install express"
// Crear y editar el archivo index.js
// Correr el servidor con "node index.js"
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express()
const port = 3000

const db = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/geoespacial_session_2' })

app.use(express.json({ limit: '10mb' }))

app.use(cors({
  origin: '*'
}))

const camposManzana = [
  'qgs_fid', 'objectid', 'secuencial', 'idproyecto', 'proyecto', 'sector',
  'idinmueble', 'manzana', 'lote', 'inmueble', 'grupo', 'terreno',
  'zonificaci', 'descripcio', 'ubicacion', 'metrajefin', 'estadoinmu',
  'idestado', 'estadoplan', 'bb', 'falta', 'proyectoid', 'aa',
  'shape_leng', 'shape_area'
]

const geojsonManzana = `
  json_build_object(
    'type', 'Feature',
    'geometry', ST_AsGeoJSON(geom)::json,
    'properties', to_jsonb(area_comercial) - 'geom'
  )
`

console.log('DATABASE_URL:', process.env.DATABASE_URL);

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.get('/api/v1/manzanas', async (req, res) => {

  try {
    const filas = await db.query(`
      SELECT json_build_object(
    'type', 'FeatureCollection',
    'features',
    json_agg(
        json_build_object(
            'type', 'Feature',

            'geometry',
            ST_AsGeoJSON(geom)::json,

            'properties',
            json_build_object(
                'id', id,
                'qgs_fid', qgs_fid,
                'objectid', objectid,
                'secuencial', secuencial,
                'idproyecto', idproyecto,
                'proyecto', proyecto,
                'sector', sector,
                'idinmueble', idinmueble,
                'manzana', manzana,
                'lote', lote,
                'inmueble', inmueble,
                'grupo', grupo,
                'terreno', terreno,
                'zonificaci', zonificaci,
                'descripcio', descripcio,
                'ubicacion', ubicacion,
                'metrajefin', metrajefin,
                'estadoinmu', estadoinmu,
                'idestado', idestado,
                'estadoplan', estadoplan,
                'bb', bb,
                'falta', falta,
                'proyectoid', proyectoid,
                'aa', aa,
                'shape_leng', shape_leng,
                'shape_area', shape_area
            )
        )
    )
) AS geojson
FROM public.area_comercial;

    `)

    res.json(filas)
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron consultar las manzanas' })
  }
})

app.get('/api/v1/manzanas/:id', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT ${geojsonManzana} AS manzana
       FROM public.area_comercial
       WHERE id = $1`,
      [req.params.id]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Manzana no encontrada' })
    }

    res.json(resultado.rows[0].manzana)
  } catch (error) {
    res.status(500).json({ error: 'No se pudo consultar la manzana' })
  }
})

app.post('/api/v1/manzanas', async (req, res) => {
  const datos = req.body.properties || req.body
  const geometria = req.body.geometry

  if (!geometria) {
    return res.status(400).json({ error: 'La geometria GeoJSON es obligatoria' })
  }

  const campos = camposManzana.filter((campo) => datos[campo] !== undefined)
  const valores = campos.map((campo) => datos[campo])
  const nombres = campos.length ? `${campos.join(', ')}, ` : ''
  const marcadores = campos.map((_, indice) => `$${indice + 1}`)
  const marcadorGeometria = `$${valores.length + 1}`

  try {
    const resultado = await db.query(
      `INSERT INTO public.area_comercial (${nombres}geom)
       VALUES (${marcadores.length ? `${marcadores.join(', ')}, ` : ''}ST_SetSRID(ST_GeomFromGeoJSON(${marcadorGeometria}), 4326))
       RETURNING id`,
      [...valores, JSON.stringify(geometria)]
    )

    res.status(201).json({ id: resultado.rows[0].id, mensaje: 'Manzana creada' })
  } catch (error) {
    res.status(500).json({ error: 'No se pudo crear la manzana' })
  }
})

app.patch('/api/v1/manzanas/:id', async (req, res) => {

  const datos = req.body.properties || req.body
  const cambios = camposManzana
    .filter((campo) => datos[campo] !== undefined)
    .map((campo) => ({ campo, valor: datos[campo] }))
  const id = Number(req.params.id)

  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id)) {
    return res.status(400).json({ error: 'El id de la manzana debe ser un numero entero' })
  }

  if (req.body.geometry) {
    cambios.push({ campo: 'geom', valor: JSON.stringify(req.body.geometry) })
  }

  if (cambios.length === 0) {
    return res.status(400).json({ error: 'No se recibieron campos para actualizar' })
  }

  const valores = cambios.map(({ valor }) => valor)
  const asignaciones = cambios.map(({ campo }, indice) => (
    campo === 'geom'
      ? `geom = ST_SetSRID(ST_GeomFromGeoJSON($${indice + 1}), 4326)`
      : `${campo} = $${indice + 1}`
  ))

  try {
    const resultado = await db.query(
      `UPDATE public.area_comercial
       SET ${asignaciones.join(', ')}
       WHERE id = $${valores.length + 1}
       RETURNING ${geojsonManzana} AS manzana`,
      [...valores, id]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Manzana no encontrada' })
    }

    res.json({
      id,
      mensaje: 'Manzana actualizada',
      manzana: resultado.rows[0].manzana
    })
  } catch (error) {
    res.status(500).json({ error: 'No se pudo actualizar la manzana' })
  }
})

app.delete('/api/v1/manzanas/:id', async (req, res) => {
  try {
    const resultado = await db.query(
      'DELETE FROM public.area_comercial WHERE id = $1 RETURNING id',
      [req.params.id]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Manzana no encontrada' })
    }

    res.json({ id: resultado.rows[0].id, mensaje: 'Manzana eliminada' })
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar la manzana' })
  }


})


app.get('/usuario', (req, res) => {

  res.json({
    id: 1,
    nombre: "Erick",
    apellido: "Escalante",
    correo: "erick@email.com",
    estado: true
  });

})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})