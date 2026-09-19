// Instalar el Node.js
// Inicialializar un proyecto con "npm init"
// Instalar el express con "npm install express"
// Crear y editar el archivo index.js
// Correr el servidor con "node index.js"
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express()
const port = 3000

const db = new Pool({ connectionString: process.env.DATABASE_URL })

console.log('DATABASE_URL:', process.env.DATABASE_URL);

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.get('/api/v1/manzanas',async (req, res) => {

  const filas= await db.query (
    `SELECT id,  ST_AsGeoJSON(geom)::json AS geom, qgs_fid, objectid, secuencial, idproyecto, proyecto, sector, idinmueble, manzana, lote, inmueble, grupo, terreno, zonificaci, descripcio, ubicacion, metrajefin, estadoinmu, idestado, estadoplan, bb, falta, proyectoid, aa, shape_leng, shape_area
	FROM public.area_comercial; `
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