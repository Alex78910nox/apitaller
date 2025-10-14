const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_VjDcsMCt7n3v@ep-noisy-brook-aeun1dhk-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function ejecutarMigracion() {
    try {
        console.log('🔄 Ejecutando migración de tokens_qr...\n');
        
        const sql = fs.readFileSync('migracion_tokens_qr.sql', 'utf8');
        await pool.query(sql);
        
        console.log('✅ Tabla tokens_qr creada exitosamente\n');
        
        // Verificar la tabla
        const resultado = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tokens_qr'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estructura de la tabla:');
        console.table(resultado.rows);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

ejecutarMigracion();
