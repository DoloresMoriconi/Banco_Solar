const express = require('express')
const { getUsuarios, setUsuario, updateUsuario, deleteUsuario, insertarTransferencia, getTransferencias } = require('./db')
const app = express()

app.listen(3000, () => {
   console.log("App escuchando puerto 3000")
})

app.use(express.json())

app.get("/", (req, res) => {
   res.sendFile(__dirname + "/index.html")
})

// GET /usuarios
app.get('/usuarios', async (req, res) => {
   try {
      const response = await getUsuarios()
      res.send(response)
   } catch (error) {
      res.statusCode = 500
      res.json({
         error: 'Algo salio mal, intentelo más tarde'
      })
   }
})

// POST /usuario
app.post("/usuario", async (req, res) => {
   const payload = req.body
   console.log(payload)
   
   try {
      if ( !payload.nombre || !payload.balance ) {
         res.statusCode = 400
         res.json({
         status: 400,
         error: 'Payload mal definido'
      })
   }
   const response = await setUsuario(payload)

   res.send(response)
} catch (error) {
      res.statusCode = 500
      res.json({
         message: 'Algo salio mal, intentelo más tarde',
         error: error
      })
   }
})

app.put("/usuario", async (req, res) => {
   const { id } = req.query
   const payload = req.body
   payload.id = id

   try {
      const response = await updateUsuario(payload)

      res.send(response)
   } catch (error) {
      res.statusCode = 500
      res.json({
         message: 'Algo salio mal, intentelo más tarde',
         error: error
      })
   }
})

// DELETE /usuario?id=2
app.delete("/usuario", async (req, res) => {
   const payload = req.query
   try {
      const result = await deleteUsuario(payload)
      res.statusCode = 202
      res.json({ message: "Usuario Eliminado" })
   } catch (error) {
      res.statusCode = 500
      res.json({ error: "algo salió mal, intentalo más tarde" })
   }
})

app.post("/transferencia", async (req, res) => {
      const payload = req.body;
      const fecha = new Date();
      payload.fecha = fecha;

      try {
         if(payload.emisor != payload.receptor)
         {
            const response = await insertarTransferencia(payload);
            res.send(response.rows);
         }
         else
         {
            res.statusCode = 400
            res.send({
            error: "No se puede transferir a la misma cuenta"
            })
         }

   } 
   catch (error) 
   {
      res.statusCode = 500;
      res.json({error: 'No fue Posible Ingresar la Transferencia.'});
   }
})

app.get("/transferencias", async (req, res) => {
   try {
      const result = await getTransferencias()

      res.json(result)
   } catch (error) {
      res.statusCode = 500;
      res.json({error: 'Error en BD.'});
   }
})