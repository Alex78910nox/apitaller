const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, probarConexion } = require('./configuracion/baseDatos');

probarConexion();

const app = express();
const puerto = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use('/public', express.static('public'));


app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>API Habitech</title>
            <style>
                body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #222; padding: 40px; min-height: 100vh; }
                .container { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); padding: 40px; max-width: 700px; margin: auto; }
                h1 { color: #667eea; font-size: 2.5em; margin-bottom: 10px; }
                .version { color: #555; font-size: 1.1em; margin-bottom: 20px; }
                p { font-size: 1.1em; margin-bottom: 20px; }
                code { background: #eee; padding: 4px 8px; border-radius: 4px; font-size: 1em; }
                ul { padding-left: 18px; line-height: 1.8; }
                li { margin-bottom: 8px; }
                .qr-section { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .qr-section h2 { color: #667eea; margin-bottom: 10px; font-size: 1.5em; }
                .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; transition: background 0.3s; }
                .btn:hover { background: #5568d3; }
                .separator { border-top: 2px solid #e5e7eb; margin: 30px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏢 API Habitech</h1>
                <div class="version">Versión 1.3 - Sistema QR Integrado</div>
                
                <div class="qr-section">
                    <h2>🎯 Escáner QR - Control de Acceso</h2>
                    <p>Simula el registro de entrada y salida con códigos QR:</p>
                    <a href="/public/escaner-qr.html" class="btn">📷 Abrir Escáner QR</a>
                </div>

                <div class="separator"></div>
                
                <p><strong>📡 Endpoints de la API:</strong></p>
                
                <p><strong>Sistema QR:</strong></p>
                <ul>
                    <li><strong>POST</strong> <code>/api/qr/generar</code> - Generar código QR</li>
                    <li><strong>POST</strong> <code>/api/qr/validar</code> - Validar QR y registrar acceso</li>
                    <li><strong>GET</strong> <code>/api/qr/usuario/:id</code> - Obtener QR de usuario</li>
                    <li><strong>DELETE</strong> <code>/api/qr/desactivar/:id</code> - Desactivar QR</li>
                    <li><strong>GET</strong> <code>/api/qr/historial/:id</code> - Historial de accesos</li>
                </ul>

                <p><strong>Gestión de Usuarios:</strong></p>
                <ul>
                    <li><strong>GET</strong> <code>/api/usuarios</code> - Listar usuarios</li>
                    <li><strong>GET</strong> <code>/api/usuarios/:id</code> - Obtener usuario por ID</li>
                    <li><strong>POST</strong> <code>/api/usuarios</code> - Crear usuario</li>
                    <li><strong>PUT</strong> <code>/api/usuarios/:id</code> - Actualizar usuario</li>
                    <li><strong>DELETE</strong> <code>/api/usuarios/:id</code> - Eliminar usuario</li>
                    <li><strong>POST</strong> <code>/api/login</code> - Login de usuario</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});


// Registrar el endpoint de login
const loginController = require('./controladores/loginController');
app.use(loginController);

// Registrar el controlador de QR
const qrController = require('./controladores/qrController');
app.use(qrController);

// Registrar el controlador de pagos (Stripe)
const pagosRouter = require('./controladores/pagos');
app.use('/api/pagos', pagosRouter);

// Importar y registrar los endpoints GET, POST, PUT y DELETE desde los controladores
const { registrarGetEndpoints } = require('./controladores/getEndpoints');
const { registrarPostEndpoints } = require('./controladores/postEndpoints');
const { registrarPutEndpoints } = require('./controladores/putEndpoints');
const { registrarDeleteEndpoints } = require('./controladores/deleteEndpoints');
const { registrarMensajesChatEndpoints } = require('./controladores/mensajesChat');
registrarGetEndpoints(app);
registrarPostEndpoints(app);
registrarPutEndpoints(app);
registrarDeleteEndpoints(app);
registrarMensajesChatEndpoints(app);

const iniciarservidor = async() => {
    try{
        await probarConexion();
        app.listen(puerto);
        console.log(`Servidor corriendo en http://localhost:${puerto}`);
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
};

iniciarservidor();
