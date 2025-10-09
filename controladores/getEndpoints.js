const { pool } = require('../configuracion/baseDatos');

const tablas = [
  'usuarios', 'sesiones_usuario', 'logs_auditoria', 'roles', 'rol_permisos', 'permisos',
  'departamentos', 'residentes', 'solicitudes_renta', 'pagos', 'anuncios', 'notificaciones',
  'mensajes_chat', 'personal_edificio', 'sensores_iot', 'dispositivos_seguridad', 'areas_comunes',
  'reservas_areas', 'solicitudes_mantenimiento', 'incidentes_emergencias', 'registros_acceso',
  'metricas_consumo', 'configuraciones_sistema', 'patrones_comportamiento', 'reglas_automatizacion',
  'predicciones_sistema', 'anomalias_detectadas', 'productos_tienda', 'pedidos_tienda', 'items_pedido_tienda'
];

function registrarGetEndpoints(app) {
  tablas.forEach(tabla => {
    // GET todos los registros
    app.get(`/api/${tabla}`, async (req, res) => {
      try {
        const resultado = await pool.query(`SELECT * FROM ${tabla}`);
        res.json({
          exito: true,
          mensaje: `${tabla} obtenidos`,
          datos: resultado.rows,
          total: resultado.rows.length
        });
      } catch (error) {
        console.error(`Error al obtener ${tabla}:`, error);
        res.status(500).json({ error: `Error al obtener ${tabla}` });
      }
    });

    // GET por id
    app.get(`/api/${tabla}/:id`, async (req, res) => {
      try {
        const id = req.params.id;
        const resultado = await pool.query(`SELECT * FROM ${tabla} WHERE id = $1`, [id]);
        if (resultado.rows.length === 0) {
          return res.status(404).json({ exito: false, mensaje: `No se encontró el registro en ${tabla} con id ${id}` });
        }
        res.json({
          exito: true,
          mensaje: `${tabla} obtenido`,
          datos: resultado.rows[0]
        });
      } catch (error) {
        console.error(`Error al obtener ${tabla} por id:`, error);
        res.status(500).json({ error: `Error al obtener ${tabla} por id` });
      }
    });
  });

  // Endpoint para obtener notificaciones por usuario_id
  app.get('/api/notificaciones/usuario/:usuario_id', async (req, res) => {
    try {
      const usuario_id = req.params.usuario_id;
      const resultado = await pool.query(
        `SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY creado_en DESC`,
        [usuario_id]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: `No se encontraron notificaciones para el usuario con id ${usuario_id}`
        });
      }

      res.json({
        exito: true,
        mensaje: `Notificaciones obtenidas para el usuario con id ${usuario_id}`,
        datos: resultado.rows
      });
    } catch (error) {
      console.error(`Error al obtener notificaciones para usuario_id ${usuario_id}:`, error);
      res.status(500).json({ error: `Error al obtener notificaciones para el usuario` });
    }
  });
}

module.exports = { registrarGetEndpoints };
