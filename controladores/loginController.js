const express = require('express');
const router = express.Router();
const { pool } = require('../configuracion/baseDatos');

// Endpoint para login de usuario
router.post('/api/login', async (req, res) => {
  const { correo, hash_contrasena, rol_id } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND hash_contrasena = $2 AND rol_id = $3',
      [correo, hash_contrasena, rol_id]
    );
    if (result.rows.length > 0) {
      // Credenciales y rol correctos
      res.json({ success: true, usuario: result.rows[0] });
    } else {
      // Credenciales o rol incorrectos
      res.status(401).json({ success: false, message: 'Credenciales o rol incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error });
  }
});

module.exports = router;
