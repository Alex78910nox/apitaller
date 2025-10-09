const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, probarConexion } = require('./configuracion/baseDatos');

probarConexion();

const app = express();
const puerto = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>API Habitech</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; color: #222; padding: 40px; }
                .container { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #ccc; padding: 32px; max-width: 500px; margin: auto; }
                h1 { color: #007bff; font-size: 2.5em; }
                .version { color: #555; font-size: 1.1em; margin-bottom: 16px; }
                p { font-size: 1.2em; }
                code { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 1.1em; }
                ul { padding-left: 18px; }
                li { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>API Habitech</h1>
                <div class="version">Versión 1.2</div>
                <p>Servidor activo. Ejemplos de uso:</p>
                <ul>
                    <li><strong>GET</strong> <code>/api/usuarios</code> - Listar usuarios</li>
                    <li><strong>GET</strong> <code>/api/usuarios/1</code> - Obtener usuario por id</li>
                    <li><strong>POST</strong> <code>/api/usuarios</code> - Crear usuario</li>
                    <li><strong>PUT</strong> <code>/api/usuarios/1</code> - Actualizar usuario</li>
                    <li><strong>DELETE</strong> <code>/api/usuarios/1</code> - Eliminar usuario</li>
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
