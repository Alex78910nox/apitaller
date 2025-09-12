const { pool } = require('../configuracion/baseDatos');

const tablasPost = [
  'roles', 'usuarios', 'departamentos', 'residentes', 'solicitudes_renta', 'pagos', 'anuncios',
  'notificaciones', 'mensajes_chat', 'personal_edificio', 'sensores_iot', 'dispositivos_seguridad',
  'areas_comunes', 'reservas_areas', 'solicitudes_mantenimiento', 'incidentes_emergencias',
  'registros_acceso', 'metricas_consumo', 'configuraciones_sistema', 'logs_auditoria',
  'sesiones_usuario', 'patrones_comportamiento', 'reglas_automatizacion', 'predicciones_sistema',
  'anomalias_detectadas', 'productos_tienda', 'pedidos_tienda', 'items_pedido_tienda'
];

function registrarPostEndpoints(app) {
  tablasPost.forEach(tabla => {
    app.post(`/api/${tabla}`, async (req, res) => {
      try {
        const datos = req.body;
        const columnas = Object.keys(datos).map(col => `"${col}"`).join(', ');
        const valores = Object.values(datos);
        const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
        const consulta = `INSERT INTO ${tabla} (${columnas}) VALUES (${placeholders}) RETURNING *`;
        const resultado = await pool.query(consulta, valores);
        res.json({
          exito: true,
          mensaje: `${tabla} insertado correctamente`,
          datos: resultado.rows[0]
        });
      } catch (error) {
        console.error(`Error al insertar en ${tabla}:`, error);
        res.status(500).json({ error: `Error al insertar en ${tabla}` });
      }
    });
  });
}

module.exports = { registrarPostEndpoints };
