const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_VjDcsMCt7n3v@ep-noisy-brook-aeun1dhk-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});


const probarConexion = async () => {
    let cliente;
    try {
        cliente = await pool.connect();
        console.log('Conexión a la base de datos exitosa');
        console.log('Base de datos: neondb (Neon)');
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
    } finally {
        if (cliente) cliente.release();
    }
};

module.exports = { pool, probarConexion };
