const express = require('express');
const router = express.Router();
const { pool } = require('../configuracion/baseDatos');

// Endpoint para login de usuario (texto plano, sin devolver contraseña)
router.post('/api/login', async (req, res) => {
  const { correo, hash_contrasena, rol_id } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND hash_contrasena = $2 AND rol_id = $3',
      [correo, hash_contrasena, rol_id]
    );
    if (result.rows.length > 0) {
      // No devolver la contraseña en la respuesta
      const usuario = { ...result.rows[0] };
      delete usuario.hash_contrasena;
      res.json({ success: true, usuario });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales o rol incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});
module.exports = router;

// --- ENDPOINT: Solicitar restablecimiento de contraseña ---
const crypto = require('crypto');

// Nodemailer para envío de correos
const nodemailer = require('nodemailer');

// Configura el transporter (ejemplo con Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alexsapereyra@gmail.com', // Cambia por tu correo
    pass: 'yonx mygh tqdk bgea' // Cambia por tu contraseña de aplicación
  }
});

async function enviarCorreo(destino, asunto, texto) {
  await transporter.sendMail({
    from: 'alexsapereyra@gmail.com',
    to: destino,
    subject: asunto,
    text: texto
  });
}

router.post('/api/solicitar-restablecimiento', async (req, res) => {
  const { correo } = req.body;
  try {
    // Verificar si el usuario existe
    const result = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    // Generar token aleatorio
    const token = crypto.randomBytes(32).toString('hex');
    // Guardar token en la base de datos
    await pool.query('UPDATE usuarios SET reset_token = $1 WHERE correo = $2', [token, correo]);
    // Enviar el token por correo al usuario
    await enviarCorreo(
      correo,
      'Habitech - Restablecimiento de contraseña',
      `Hola,

Recibiste este correo porque solicitaste restablecer tu contraseña en Habitech.

Tu token de restablecimiento es:

${token}

Si no solicitaste este cambio, ignora este mensaje.

¡Saludos del equipo Habitech!`
    );
    res.json({ success: true, message: 'Token de restablecimiento generado', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});

// --- ENDPOINT: Restablecer contraseña solo con token ---
router.post('/api/restablecer-contrasena', async (req, res) => {
  const { token, nueva_contrasena } = req.body;
  try {
    // Buscar usuario con ese token (sin validar expiración)
    const result = await pool.query('SELECT id FROM usuarios WHERE reset_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }
    // Actualizar la contraseña y limpiar el token
    await pool.query('UPDATE usuarios SET hash_contrasena = $1, reset_token = NULL, reset_token_expira = NULL WHERE reset_token = $2', [nueva_contrasena, token]);
    res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});
