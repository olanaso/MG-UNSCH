// Instalar el Node.js
// Inicialializar un proyecto con "npm init"
// Instalar el express con "npm install express"
// Crear y editar el archivo index.js
// Correr el servidor con "node index.js"

const express = require('express');
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
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