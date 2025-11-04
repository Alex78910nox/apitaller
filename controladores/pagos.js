const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../configuracion/baseDatos');
const SibApiV3Sdk = require('@getbrevo/brevo');

// Configurar Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

router.post('/crear', async (req, res) => {
  const { residenteId, monto, descripcion } = req.body;
  try {
    // Stripe espera el monto en centavos
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(monto * 100),
      currency: 'bob', // Bolivianos
      description: descripcion,
      metadata: { residenteId: String(residenteId) }
    });
    res.json({
      exito: true,
      clientSecret: paymentIntent.client_secret,
      mensaje: 'PaymentIntent creado'
    });
  } catch (err) {
    res.status(500).json({ exito: false, mensaje: err.message });
  }
});

module.exports = router;

// Endpoint para crear sesión de Stripe Checkout
router.post('/crear-sesion-checkout', async (req, res) => {
  try {
    const { residenteId, monto, descripcion } = req.body;
    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bob', // Bolivianos
            product_data: {
              name: descripcion || 'Pago de servicio Habitech',
            },
            unit_amount: Math.round(monto * 100), // Monto en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/pago-cancelado',
      metadata: {
        residenteId: residenteId.toString(),
        descripcion: descripcion,
      },
    });

    res.json({
      exito: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error al crear sesión de checkout:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear sesión de checkout',
      error: error.message,
    });
  }
});

// Endpoint para actualizar el estado de un pago
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que el estado sea válido
    const estadosValidos = ['pendiente', 'pagado', 'vencido', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Estado no válido'
      });
    }

    // Actualizar el estado en la base de datos
    const query = 'UPDATE pagos SET estado = $1, fecha_pago = $2 WHERE id = $3 RETURNING *';
    const values = [estado, estado === 'pagado' ? new Date() : null, id];
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pago no encontrado'
      });
    }

    const pago = result.rows[0];

    // Si el estado es "pagado", enviar factura por correo
    if (estado === 'pagado') {
      try {
        console.log('Intentando enviar factura para pago:', pago);
        
        // Obtener información del residente
        const residenteQuery = await pool.query(
          'SELECT r.*, u.correo, u.nombre FROM residentes r JOIN usuarios u ON r.usuario_id = u.id WHERE r.id = $1',
          [pago.residente_id]
        );

        console.log('Resultado query residente:', residenteQuery.rows);

        if (residenteQuery.rows.length > 0) {
          const residente = residenteQuery.rows[0];
          const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Crear el correo con la factura
          const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
          sendSmtpEmail.subject = `Factura de Pago - Habitech #${pago.id}`;
          sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0;">🏢 Habitech</h1>
                <h2 style="margin: 10px 0 0 0; font-weight: normal;">Factura de Pago</h2>
              </div>
              
              <div style="padding: 30px; background: #f9f9f9;">
                <h3 style="color: #667eea; margin-top: 0;">Detalles del Pago</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr style="background: white;">
                    <td style="padding: 12px; border: 1px solid #ddd;"><strong>Número de Factura:</strong></td>
                    <td style="padding: 12px; border: 1px solid #ddd;">#${pago.id}</td>
                  </tr>
                  <tr style="background: #f5f5f5;">
                    <td style="padding: 12px; border: 1px solid #ddd;"><strong>Residente:</strong></td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${residente.nombre}</td>
                  </tr>
                  <tr style="background: white;">
                    <td style="padding: 12px; border: 1px solid #ddd;"><strong>Fecha de Pago:</strong></td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${fechaPago}</td>
                  </tr>
                  <tr style="background: #f5f5f5;">
                    <td style="padding: 12px; border: 1px solid #ddd;"><strong>Descripción:</strong></td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${pago.descripcion || 'Pago de servicio'}</td>
                  </tr>
                  <tr style="background: white;">
                    <td style="padding: 12px; border: 1px solid #ddd;"><strong>Monto:</strong></td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #667eea;">Bs ${parseFloat(pago.monto).toFixed(2)}</td>
                  </tr>
                  <tr style="background: #e8f5e9;">
                    <td style="padding: 12px; border: 1px solid #ddd;"><strong>Estado:</strong></td>
                    <td style="padding: 12px; border: 1px solid #ddd; color: #4caf50; font-weight: bold;">✓ PAGADO</td>
                  </tr>
                </table>

                <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0; color: #666;">Gracias por tu pago. Esta es tu factura oficial.</p>
                  <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
              </div>

              <div style="background: #667eea; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px;">
                © 2025 Habitech. Todos los derechos reservados.
              </div>
            </div>
          `;
          sendSmtpEmail.sender = {
            name: 'Habitech',
            email: process.env.BREVO_FROM_EMAIL || 'noreply@habitech.com'
          };
          sendSmtpEmail.to = [{
            email: residente.correo,
            name: residente.nombre
          }];

          await apiInstance.sendTransacEmail(sendSmtpEmail);
          console.log(`✓ Factura enviada exitosamente a ${residente.correo} para pago #${pago.id}`);
        } else {
          console.log('No se encontró información del residente con id:', pago.residente_id);
        }
      } catch (emailError) {
        console.error('Error al enviar factura por correo:', emailError);
        console.error('Stack trace:', emailError.stack);
        // No fallar la respuesta si el correo falla
      }
    }

    res.json({
      exito: true,
      mensaje: estado === 'pagado' ? 'Estado actualizado y factura enviada por correo' : 'Estado actualizado correctamente',
      datos: pago
    });
  } catch (error) {
    console.error('Error al actualizar estado del pago:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar el estado',
      error: error.message
    });
  }
});
