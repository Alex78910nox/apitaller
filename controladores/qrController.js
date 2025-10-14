const express = require('express');
const router = express.Router();
const { pool } = require('../configuracion/baseDatos');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Clave secreta para firmar los tokens QR (cámbiala por una más segura en producción)
const QR_SECRET = process.env.QR_SECRET || 'habitech_qr_secret_2024';

/**
 * POST /api/qr/generar
 * Genera un código QR único y permanente para un usuario
 * Body: { usuario_id: number }
 */
router.post('/api/qr/generar', async (req, res) => {
  const { usuario_id } = req.body;

  try {
    // Verificar que el usuario existe
    const usuarioResult = await pool.query(
      'SELECT id, nombre, apellido, correo FROM usuarios WHERE id = $1',
      [usuario_id]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const usuario = usuarioResult.rows[0];

    // Verificar si ya tiene un QR generado
    const qrExistente = await pool.query(
      'SELECT token FROM tokens_qr WHERE usuario_id = $1',
      [usuario_id]
    );

    let qrToken;

    if (qrExistente.rows.length > 0) {
      // Ya tiene un QR, usamos el existente
      qrToken = qrExistente.rows[0].token;
    } else {
      // Generar un token único y permanente
      // Usamos el ID del usuario + un hash único como identificador
      const uniqueId = crypto.createHash('sha256')
        .update(`${usuario_id}-${usuario.correo}-${Date.now()}`)
        .digest('hex');

      qrToken = `HABITECH-${usuario_id}-${uniqueId}`;

      // Guardar el token en la base de datos (sin expiración)
      await pool.query(
        `INSERT INTO tokens_qr (usuario_id, token, generado_en, activo) 
         VALUES ($1, $2, NOW(), true)`,
        [usuario_id, qrToken]
      );
    }

    // Generar la imagen del código QR
    const qrImageUrl = await QRCode.toDataURL(qrToken, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      message: 'Código QR generado exitosamente',
      qr: {
        token: qrToken,
        image: qrImageUrl,
        permanente: true,
        usuario: {
          id: usuario.id,
          nombre: `${usuario.nombre} ${usuario.apellido}`
        }
      }
    });

  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar código QR', 
      error: error.message 
    });
  }
});

/**
 * POST /api/qr/validar
 * Valida un código QR escaneado y registra el acceso
 * Body: { qr_token: string, dispositivo_id: number, tipo: 'entrada' | 'salida' }
 */
router.post('/api/qr/validar', async (req, res) => {
  const { qr_token, dispositivo_id, tipo } = req.body;

  try {
    // Extraer el usuario_id del token QR (formato: HABITECH-{usuario_id}-{hash})
    const tokenParts = qr_token.split('-');
    if (tokenParts.length < 3 || tokenParts[0] !== 'HABITECH') {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de código QR inválido' 
      });
    }

    const usuario_id = parseInt(tokenParts[1]);

    // Verificar que el token existe en la base de datos
    const tokenResult = await pool.query(
      'SELECT activo FROM tokens_qr WHERE usuario_id = $1 AND token = $2',
      [usuario_id, qr_token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Código QR no válido' 
      });
    }

    if (!tokenResult.rows[0].activo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Código QR desactivado. Contacte al administrador.' 
      });
    }

    // Verificar que el usuario existe y está activo
    const usuarioResult = await pool.query(
      'SELECT id, nombre, apellido, activo FROM usuarios WHERE id = $1',
      [usuario_id]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const usuario = usuarioResult.rows[0];

    // Verificar que el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario inactivo. Acceso denegado.' 
      });
    }

    // Registrar el acceso en la tabla registros_acceso
    const registroResult = await pool.query(
      `INSERT INTO registros_acceso (usuario_id, dispositivo_id, tipo, fecha_hora) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, fecha_hora`,
      [usuario_id, dispositivo_id || null, tipo || 'entrada']
    );

    const registro = registroResult.rows[0];

    res.json({
      success: true,
      message: `Acceso registrado exitosamente: ${tipo || 'entrada'}`,
      registro: {
        id: registro.id,
        usuario: {
          id: usuario.id,
          nombre: `${usuario.nombre} ${usuario.apellido}`
        },
        tipo: tipo || 'entrada',
        fecha_hora: registro.fecha_hora,
        dispositivo_id: dispositivo_id
      }
    });

  } catch (error) {
    console.error('Error al validar QR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al validar código QR', 
      error: error.message 
    });
  }
});

/**
 * GET /api/qr/usuario/:usuario_id
 * Obtiene el QR activo de un usuario
 */
router.get('/api/qr/usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // Buscar el token QR activo del usuario
    const tokenResult = await pool.query(
      `SELECT token, generado_en, activo 
       FROM tokens_qr 
       WHERE usuario_id = $1 AND activo = true
       LIMIT 1`,
      [usuario_id]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay código QR activo para este usuario. Genera uno nuevo.' 
      });
    }

    const tokenData = tokenResult.rows[0];
    
    // Regenerar la imagen del QR
    const qrImageUrl = await QRCode.toDataURL(tokenData.token, {
      width: 400,
      margin: 2
    });

    res.json({
      success: true,
      qr: {
        token: tokenData.token,
        image: qrImageUrl,
        generado_en: tokenData.generado_en
      }
    });

  } catch (error) {
    console.error('Error al obtener QR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener código QR', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/qr/desactivar/:usuario_id
 * Desactiva el código QR de un usuario (útil si se pierde el dispositivo)
 */
router.delete('/api/qr/desactivar/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    await pool.query(
      'UPDATE tokens_qr SET activo = false WHERE usuario_id = $1',
      [usuario_id]
    );

    res.json({
      success: true,
      message: 'Código QR desactivado correctamente'
    });

  } catch (error) {
    console.error('Error al desactivar QR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al desactivar código QR', 
      error: error.message 
    });
  }
});

/**
 * GET /api/qr/historial/:usuario_id
 * Obtiene el historial de accesos de un usuario
 */
router.get('/api/qr/historial/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  const { limit = 50 } = req.query;

  try {
    const resultado = await pool.query(
      `SELECT ra.id, ra.tipo, ra.fecha_hora, ra.dispositivo_id, ds.nombre as dispositivo_nombre
       FROM registros_acceso ra
       LEFT JOIN dispositivos_seguridad ds ON ra.dispositivo_id = ds.id
       WHERE ra.usuario_id = $1
       ORDER BY ra.fecha_hora DESC
       LIMIT $2`,
      [usuario_id, limit]
    );

    res.json({
      success: true,
      historial: resultado.rows
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial de accesos', 
      error: error.message 
    });
  }
});

module.exports = router;
