require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  // Crear transportador
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true // Activar logs de debug
  });

  try {
    // Verificar configuración
    console.log('Verificando configuración...');
    await transporter.verify();
    console.log('Configuración correcta');

    // Intentar enviar correo
    console.log('Intentando enviar correo...');
    const info = await transporter.sendMail({
      from: `"Habitech System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Enviar a ti mismo para probar
      subject: 'Prueba de correo ✔',
      text: 'Si puedes ver este mensaje, el envío de correos está funcionando correctamente.',
      html: '<b>Si puedes ver este mensaje, el envío de correos está funcionando correctamente.</b>'
    });

    console.log('Mensaje enviado: %s', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();