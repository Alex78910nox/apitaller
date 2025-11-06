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

  // Endpoint para obtener pagos por residente_id
  app.get('/api/pagos/residente/:residente_id', async (req, res) => {
    try {
      const residente_id = req.params.residente_id;
      const resultado = await pool.query(
        `SELECT * FROM pagos WHERE residente_id = $1 ORDER BY fecha_pago DESC`,
        [residente_id]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: `No se encontraron pagos para el residente con id ${residente_id}`
        });
      }

      res.json({
        exito: true,
        mensaje: `Pagos obtenidos para el residente con id ${residente_id}`,
        datos: resultado.rows,
        total: resultado.rows.length
      });
    } catch (error) {
      console.error(`Error al obtener pagos para residente_id ${residente_id}:`, error);
      res.status(500).json({ error: `Error al obtener los pagos del residente` });
    }
  });

  // Endpoint para obtener métricas de consumo por departamento_id
  app.get('/api/metricas_consumo/departamento/:departamento_id', async (req, res) => {
    try {
      const departamento_id = req.params.departamento_id;
      const resultado = await pool.query(
        `SELECT * FROM metricas_consumo WHERE departamento_id = $1 ORDER BY fecha_registro DESC`,
        [departamento_id]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: `No se encontraron métricas de consumo para el departamento con id ${departamento_id}`
        });
      }

      res.json({
        exito: true,
        mensaje: `Métricas de consumo obtenidas para el departamento con id ${departamento_id}`,
        datos: resultado.rows,
        total: resultado.rows.length
      });
    } catch (error) {
      console.error(`Error al obtener métricas de consumo para departamento_id ${departamento_id}:`, error);
      res.status(500).json({ error: `Error al obtener las métricas de consumo del departamento` });
    }
  });

  // Endpoint para obtener reservas de áreas comunes por residente_id
  app.get('/api/reservas_areas/residente/:residente_id', async (req, res) => {
    try {
      const residente_id = req.params.residente_id;
      const resultado = await pool.query(
        `SELECT r.*, a.nombre as nombre_area, a.descripcion as descripcion_area, a.capacidad, a.pago_por_uso 
         FROM reservas_areas r 
         JOIN areas_comunes a ON r.area_id = a.id 
         WHERE r.residente_id = $1 
         ORDER BY r.fecha_reserva DESC`,
        [residente_id]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: `No se encontraron reservas para el residente con id ${residente_id}`
        });
      }

      res.json({
        exito: true,
        mensaje: `Reservas obtenidas para el residente con id ${residente_id}`,
        datos: resultado.rows,
        total: resultado.rows.length
      });
    } catch (error) {
      console.error(`Error al obtener reservas para residente_id ${residente_id}:`, error);
      res.status(500).json({ error: `Error al obtener las reservas del residente` });
    }
  });
}

module.exports = { registrarGetEndpoints };
