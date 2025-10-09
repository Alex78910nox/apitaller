const { pool } = require('../configuracion/baseDatos');

function registrarMensajesChatEndpoints(app) {
  // Obtener conversaciones recientes
  app.get('/api/mensajes_chat/conversaciones/:usuario_id', async (req, res) => {
    try {
      const usuario_id = req.params.usuario_id;
      const resultado = await pool.query(
        `SELECT DISTINCT ON (GREATEST(remitente_id, destinatario_id), LEAST(remitente_id, destinatario_id))
          mc.id, mc.remitente_id, remitente.nombre AS remitente_nombre, remitente.apellido AS remitente_apellido,
          mc.destinatario_id, destinatario.nombre AS destinatario_nombre, destinatario.apellido AS destinatario_apellido,
          mc.mensaje, mc.tipo_mensaje, mc.leido, mc.creado_en
         FROM mensajes_chat mc
         LEFT JOIN usuarios remitente ON mc.remitente_id = remitente.id
         LEFT JOIN usuarios destinatario ON mc.destinatario_id = destinatario.id
         WHERE mc.remitente_id = $1 OR mc.destinatario_id = $1
         ORDER BY GREATEST(mc.remitente_id, mc.destinatario_id), 
                  LEAST(mc.remitente_id, mc.destinatario_id), mc.creado_en DESC;`,
        [usuario_id]
      );
      res.json({ exito: true, conversaciones: resultado.rows });
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
  });

  // Obtener mensajes entre dos usuarios
  app.get('/api/mensajes_chat/:usuario_id/:contacto_id', async (req, res) => {
    try {
      const { usuario_id, contacto_id } = req.params;
      const resultado = await pool.query(
        `SELECT * FROM mensajes_chat
         WHERE (remitente_id = $1 AND destinatario_id = $2)
            OR (remitente_id = $2 AND destinatario_id = $1)
         ORDER BY creado_en ASC;`,
        [usuario_id, contacto_id]
      );
      res.json({ exito: true, mensajes: resultado.rows });
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      res.status(500).json({ error: 'Error al obtener mensajes' });
    }
  });

  // Enviar un mensaje
  app.post('/api/mensajes_chat', async (req, res) => {
    try {
      const { remitente_id, destinatario_id, mensaje, tipo_mensaje, url_archivo } = req.body;
      const resultado = await pool.query(
        `INSERT INTO mensajes_chat (remitente_id, destinatario_id, mensaje, tipo_mensaje, url_archivo)
         VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
        [remitente_id, destinatario_id, mensaje, tipo_mensaje || 'texto', url_archivo]
      );
      res.status(201).json({ exito: true, mensaje: resultado.rows[0] });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      res.status(500).json({ error: 'Error al enviar mensaje' });
    }
  });

  // Marcar mensajes como leídos
  app.put('/api/mensajes_chat/leidos', async (req, res) => {
    try {
      const { usuario_id, remitente_id } = req.body;
      await pool.query(
        `UPDATE mensajes_chat
         SET leido = TRUE, leido_en = CURRENT_TIMESTAMP
         WHERE destinatario_id = $1 AND remitente_id = $2 AND leido = FALSE;`,
        [usuario_id, remitente_id]
      );
      res.json({ exito: true, mensaje: 'Mensajes marcados como leídos' });
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
      res.status(500).json({ error: 'Error al marcar mensajes como leídos' });
    }
  });

  // Listar todos los usuarios
  app.get('/api/usuarios', async (req, res) => {
    try {
      const resultado = await pool.query(
        `SELECT id, nombre, apellido FROM usuarios ORDER BY nombre, apellido;`
      );
      res.json({ exito: true, usuarios: resultado.rows });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  });
}

module.exports = { registrarMensajesChatEndpoints };