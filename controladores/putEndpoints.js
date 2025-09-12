const { pool } = require('../configuracion/baseDatos');

const tablasPut = [
  'usuarios', 'departamentos', 'residentes', 'solicitudes_renta', 'pagos', 'anuncios',
  'notificaciones', 'mensajes_chat', 'personal_edificio', 'sensores_iot', 'dispositivos_seguridad',
  'areas_comunes', 'reservas_areas', 'solicitudes_mantenimiento', 'incidentes_emergencias',
  'registros_acceso', 'metricas_consumo', 'configuraciones_sistema', 'logs_auditoria',
  'sesiones_usuario', 'patrones_comportamiento', 'reglas_automatizacion', 'predicciones_sistema',
  'anomalias_detectadas', 'productos_tienda', 'pedidos_tienda', 'items_pedido_tienda'
];

function registrarPutEndpoints(app) {
  tablasPut.forEach(tabla => {
    app.put(`/api/${tabla}/:id`, async (req, res) => {
      try {
        const id = req.params.id;
        const datos = req.body;
        const columnas = Object.keys(datos);
        const asignaciones = columnas.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
        const valores = Object.values(datos);
        const consulta = `UPDATE ${tabla} SET ${asignaciones} WHERE id = $${columnas.length + 1} RETURNING *`;
        const resultado = await pool.query(consulta, [...valores, id]);
        if (resultado.rows.length === 0) {
          return res.status(404).json({ exito: false, mensaje: `No se encontró el registro en ${tabla} con id ${id}` });
        }
        res.json({
          exito: true,
          mensaje: `${tabla} actualizado correctamente`,
          datos: resultado.rows[0]
        });
      } catch (error) {
        console.error(`Error al actualizar en ${tabla}:`, error);
        res.status(500).json({ error: `Error al actualizar en ${tabla}` });
      }
    });
  });
}

module.exports = { registrarPutEndpoints };
