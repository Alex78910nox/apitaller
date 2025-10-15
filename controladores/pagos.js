const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/crear', async (req, res) => {
  const { residenteId, monto, descripcion } = req.body;
  try {
    // Stripe espera el monto en centavos
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(monto * 100),
      currency: 'usd', // o la moneda que uses
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
            currency: 'usd',
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
