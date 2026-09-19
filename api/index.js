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

const db = new Pool({ connectionString: process.env.DATABASE_URL })

app.use(cors({
  origin: '*'
}))

console.log('DATABASE_URL:', process.env.DATABASE_URL);

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.get('/api/v1/manzanas', async (req, res) => {

  const filas = await db.query(
    `
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

     `
  )

  res.json(filas)


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