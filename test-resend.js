require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log('API Key configurada:', !!process.env.RESEND_API_KEY);
  console.log('Remitente:', process.env.RESEND_FROM_EMAIL);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Habitech <onboarding@resend.dev>',
      to: 'alexsapereyra@gmail.com', // Solo puedes enviar a este correo (el que usaste para registrarte)
      subject: 'Prueba de Resend - Habitech',
      html: '<h1>¡Funciona!</h1><p>Este es un correo de prueba enviado con Resend.</p>'
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Éxito!');
    console.log('Data:', data);
  } catch (err) {
    console.error('Error general:', err);
  }
}

testResend();
