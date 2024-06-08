const { Pool } = require('pg');

const config = {
   user: process.env.USERDB,
   host: process.env.HOST,
   database: process.env.DATABASE,
   password: process.env.PASSWORD,
   port: process.env.PORT,
}

const pool = new Pool(config);

// Usuarios
const getUsuarios = async () => {
   const text = "SELECT * FROM usuarios"
   const response = await pool.query(text)
   return response.rows
}

const setUsuario = async (payload) => {
   const text = 'INSERT INTO usuarios (nombre, balance ) VALUES ($1, $2) RETURNING *'
   const values = [payload.nombre, payload.balance]

   const result = await pool.query(text, values)
   return result.rows
}

const updateUsuario = async (payload) => {
   const text = 'UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3'
   const values = [payload.name, payload.balance, payload.id]

   const result = await pool.query(text, values)
   return result.rows
}

const deleteUsuario = async (payload) => {
   const text = 'DELETE FROM usuarios WHERE id = $1'
   const values = [payload.id]

   const result = await pool.query(text, values)
   return result.rows
}

const insertarTransferencia = async (payload) => {
   const client = await pool.connect();

   try {
      await client.query("BEGIN");

     // encontrar ID del emisor
      const id1 = "SELECT * FROM usuarios WHERE nombre = $1"
      const values1 = [payload.emisor]
      const emisor = await client.query(id1, values1)
   
      // encintrar ID del receptor
      const id2 = "SELECT * FROM usuarios WHERE nombre = $1"
      const values2 = [payload.receptor]
      const receptor = await client.query(id2, values2)
   
      const idEmisor = emisor.rows[0].id
      const idReceptor = receptor.rows[0].id

     //Descontar
      const descontar = "UPDATE usuarios SET balance = balance - $1 WHERE id= $2";
      const valuesDescontar = [payload.monto, idEmisor];
      await client.query(descontar, valuesDescontar);
   
     //Aumentar
      const aumentar = "UPDATE usuarios SET balance = balance + $1 WHERE id = $2";
      const valuesAumentar = [payload.monto, idReceptor];
      await client.query(aumentar, valuesAumentar);
      
     //Insertar Transferencia
     const text = "INSERT INTO transferencias(emisor, receptor, monto, fecha) VALUES($1, $2, $3, $4) RETURNING *";
      const valuesTransferencia = [idEmisor, idReceptor, payload.monto, payload.fecha];
      const result = await pool.query(text, valuesTransferencia);

     //Terminar Transaccion
      await client.query("COMMIT");
      return result;
      } catch (error) {
      await client.query("ROLLBACK")
      console.error(error)
      } finally {
      client.release()
      console.log("Termino Transaccion")
   }
}

const getTransferencias = async () => {
   const text = 'SELECT * FROM transferencias'
   const values = []
   const queryObject = {
      text: text,
      values: values,
      rowMode: 'array'
   }

   const result = await pool.query(queryObject)

   return result.rows
}

module.exports = { getUsuarios, setUsuario, updateUsuario, deleteUsuario, insertarTransferencia, getTransferencias }