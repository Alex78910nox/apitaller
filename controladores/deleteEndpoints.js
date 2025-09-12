const { pool } = require('../configuracion/baseDatos');

const tablasDelete = [
  'anuncios', 'notificaciones', 'mensajes_chat', 'logs_auditoria', 'configuraciones_sistema',
  'patrones_comportamiento', 'reglas_automatizacion', 'predicciones_sistema', 'anomalias_detectadas',
  'productos_tienda', 'items_pedido_tienda'
];

function registrarDeleteEndpoints(app) {
  tablasDelete.forEach(tabla => {
    app.delete(`/api/${tabla}/:id`, async (req, res) => {
      try {
        const id = req.params.id;
        const consulta = `DELETE FROM ${tabla} WHERE id = $1 RETURNING *`;
        const resultado = await pool.query(consulta, [id]);
        if (resultado.rows.length === 0) {
          return res.status(404).json({ exito: false, mensaje: `No se encontró el registro en ${tabla} con id ${id}` });
        }
        res.json({
          exito: true,
          mensaje: `${tabla} eliminado correctamente`,
          datos: resultado.rows[0]
        });
      } catch (error) {
        console.error(`Error al eliminar en ${tabla}:`, error);
        res.status(500).json({ error: `Error al eliminar en ${tabla}` });
      }
    });
  });
}

module.exports = { registrarDeleteEndpoints };
