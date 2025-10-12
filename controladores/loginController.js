// --- TWILIO SMS ---

require('dotenv').config();
const twilio = require('twilio');
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const twilioNumber = process.env.TWILIO_NUMBER;

async function enviarSMS(destino, mensaje) {
  try {
    await twilioClient.messages.create({
      body: mensaje,
      from: twilioNumber,
      to: destino
    });
  } catch (err) {
    console.error('Error enviando SMS:', err);
  }
}
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

// --- REGISTRO Y VERIFICACIÓN DOBLE FACTOR ---
// Endpoint para iniciar registro con doble factor
router.post('/api/registro-doble-factor', async (req, res) => {
  const { correo, hash_contrasena, nombre, apellido, telefono, numero_documento, rol_id } = req.body;
  try {
    // Verificar si ya existe el usuario
    const existe = await pool.query('SELECT id FROM usuarios WHERE correo = $1 OR telefono = $2', [correo, telefono]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo o teléfono ya está registrado' });
    }
    // Generar códigos de verificación
    const codigoCorreo = Math.floor(100000 + Math.random() * 900000).toString();
    const codigoTelefono = Math.floor(100000 + Math.random() * 900000).toString();
    // Guardar usuario como pendiente (activo: false) y guardar los códigos
    await pool.query(
      `INSERT INTO usuarios (correo, hash_contrasena, nombre, apellido, telefono, numero_documento, rol_id, activo, codigo_verif_correo, codigo_verif_telefono)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false,$8,$9)`,
      [correo, hash_contrasena, nombre, apellido, telefono, numero_documento, rol_id, codigoCorreo, codigoTelefono]
    );
    // Enviar código al correo
    await enviarCorreo(
      correo,
      'Código de verificación Habitech',
      `Tu código de verificación de correo es: ${codigoCorreo}`
    );
  // Enviar SMS real con Twilio
  await enviarSMS(telefono, `Tu código de verificación de teléfono es: ${codigoTelefono}`);
    res.json({ success: true, message: 'Usuario registrado como pendiente. Se enviaron los códigos de verificación.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});

// Endpoint para verificar ambos códigos y activar usuario
router.post('/api/verificar-doble-factor', async (req, res) => {
  const { correo, codigoCorreo, codigoTelefono } = req.body;
  try {
    // Buscar usuario pendiente con ambos códigos
    const result = await pool.query(
      `SELECT id FROM usuarios WHERE correo = $1 AND codigo_verif_correo = $2 AND codigo_verif_telefono = $3 AND activo = false`,
      [correo, codigoCorreo, codigoTelefono]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Códigos incorrectos o usuario ya verificado' });
    }
    // Activar usuario y limpiar los códigos
    await pool.query(
      `UPDATE usuarios SET activo = true, codigo_verif_correo = NULL, codigo_verif_telefono = NULL WHERE correo = $1`,
      [correo]
    );
    res.json({ success: true, message: 'Usuario verificado y activado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});

// Endpoint: obtener residente por usuario_id
router.get('/api/residente-por-usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  try {
    // Hacer LEFT JOIN para obtener datos del departamento asociado
    const consulta = `
      SELECT r.*, d.id AS dept_id, d.numero, d.piso, d.dormitorios, d.banos, d.area_m2, d.renta_mensual, d.mantenimiento_mensual, d.estado, d.descripcion, d.servicios, d.imagenes, d.activo AS dept_activo, d.creado_en AS dept_creado_en
      FROM residentes r
      LEFT JOIN departamentos d ON r.departamento_id = d.id
      WHERE r.usuario_id = $1
    `;
    const resultado = await pool.query(consulta, [usuario_id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Residente no encontrado para ese usuario' });
    }
    const row = resultado.rows[0];
    const residente = {
      id: row.id,
      usuario_id: row.usuario_id,
      departamento_id: row.departamento_id,
      tipo_relacion: row.tipo_relacion,
      fecha_ingreso: row.fecha_ingreso,
      fecha_salida: row.fecha_salida,
      nombre_contacto_emergencia: row.nombre_contacto_emergencia,
      telefono_contacto_emergencia: row.telefono_contacto_emergencia,
      es_principal: row.es_principal,
      activo: row.activo,
      creado_en: row.creado_en
    };
    const departamento = row.dept_id ? {
      id: row.dept_id,
      numero: row.numero,
      piso: row.piso,
      dormitorios: row.dormitorios,
      banos: row.banos,
      area_m2: row.area_m2,
      renta_mensual: row.renta_mensual,
      mantenimiento_mensual: row.mantenimiento_mensual,
      estado: row.estado,
      descripcion: row.descripcion,
      servicios: row.servicios,
      imagenes: row.imagenes,
      activo: row.dept_activo,
      creado_en: row.dept_creado_en
    } : null;
    res.json({ success: true, residente, departamento });
  } catch (error) {
    console.error('Error al buscar residente por usuario_id:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});

module.exports = router;

// --- ENDPOINT: Solicitar restablecimiento de contraseña ---
const crypto = require('crypto');

// Nodemailer para envío de correos
const nodemailer = require('nodemailer');

// Configura el transporter con timeout reducido y conexión SMTP directa
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'alexsapereyra@gmail.com',
    pass: 'yonx mygh tqdk bgea'
  },
  connectionTimeout: 5000, // 5 segundos de timeout
  greetingTimeout: 5000,
  socketTimeout: 5000
});

async function enviarCorreo(destino, asunto, texto) {
  try {
    const info = await transporter.sendMail({
      from: 'alexsapereyra@gmail.com',
      to: destino,
      subject: asunto,
      text: texto
    });
    console.log('Email enviado:', info.response);
    return info;
  } catch (error) {
    console.error('Error al enviar email:', error);
    // Agregar más detalles del error para debug
    if (error.code === 'ETIMEDOUT') {
      console.error('Timeout al enviar email - revisa la conexión SMTP');
    }
    throw error;
  }
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
