const { Pool } = require('pg');

const config = {
   user: process.env.DB_USER, 
   host: process.env.DB_HOST, 
   database: process.env.DB_NAME, 
   password: process.env.DB_PASS, 
   port: process.env.DB_PORT, 
}

const pool = new Pool(config);

//funcion asincrona para obtener todos los usuarios
const getUsuarios = async () => {
   const text = "SELECT * FROM usuarios"
   const response = await pool.query(text)

   return response.rows
}

//funcion asincrona para insertar un nuevo usuario
const setUsuario = async (payload) => {
   const text = 'INSERT INTO usuarios (nombre, balance ) VALUES ($1, $2) RETURNING *'
   const values = [payload.nombre, payload.balance]

   const result = await pool.query(text, values)
   return result.rows
}

//funcion asincrona para ediar un usuario
const updateUsuario = async (payload) => {
   const text = 'UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3'
   const values = [payload.name, payload.balance, payload.id]

   const result = await pool.query(text, values)
   return result.rows
}

//funcion asincrona para eliminar un usuario
const deleteUsuario = async (payload) => {
   const text = 'DELETE FROM usuarios WHERE id = $1'
   const values = [payload.id]

   const result = await pool.query(text, values)
   return result.rows
}

//funcion asincrona para crear una nueva transferencia
const insertarTransferencia = async (payload) => {
   const client = await pool.connect();
   try {
      await client.query("BEGIN");

      // encontrar ID del emisor
      const id1 = "SELECT * FROM usuarios WHERE nombre = $1"
      const values1 = [payload.emisor];
      const emisor = await client.query(id1, values1);
      console.log('Emisor:', emisor.rows);
   
      // encontrar ID del receptor
      const id2 = "SELECT * FROM usuarios WHERE nombre = $1"
      const values2 = [payload.receptor];
      const receptor = await client.query(id2, values2);
      console.log('Receptor:', receptor.rows);

      if (emisor.rows.length === 0 || receptor.rows.length === 0) {
         throw new Error("Emisor o receptor no encontrado");
      }
   
      const idEmisor = emisor.rows[0].id
      const idReceptor = receptor.rows[0].id
   
      //disminuir el saldo del emisor
      const descontar = "UPDATE usuarios SET balance = balance - $1 WHERE id= $2";
      const valuesDescontar = [payload.monto, idEmisor];
      await client.query(descontar, valuesDescontar);
      
      //aumentar el saldo del receptor
      const aumentar = "UPDATE usuarios SET balance = balance + $1 WHERE id = $2";
      const valuesAumentar = [payload.monto, idReceptor];
      await client.query(aumentar, valuesAumentar);
      
      //registrar la transferencia
      const text = "INSERT INTO transferencias(emisor, receptor, monto, fecha) VALUES($1, $2, $3, $4) RETURNING *";
      const valuesTransferencia = [idEmisor, idReceptor, payload.monto, payload.fecha];
      const result = await client.query(text, valuesTransferencia);
      console.log('Transferencia creada:', result.rows);

      //terminar la transaccion
      await client.query("COMMIT");
      return result;
      } catch (error) {
      await client.query("ROLLBACK");
      console.error(error);
      throw error;
      } finally {
      client.release();
      console.log("Finalizo la Transaccion");
      }
}

//funcion asincrona para obtener todas las transferencias
const getTransferencias = async () => {
   const text = `SELECT t.id, u1.nombre AS emisor, u2.nombre AS receptor, t.monto, t.fecha 
   FROM transferencias t
   JOIN usuarios u1 ON t.emisor = u1.id
   JOIN usuarios u2 ON t.receptor = u2.id`;

   const result = await pool.query(text)
   console.log('Transferencias obtenidas:', result.rows);
   return result.rows
}

module.exports = { getUsuarios, setUsuario, updateUsuario, deleteUsuario, insertarTransferencia, getTransferencias }