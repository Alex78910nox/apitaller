-- Tabla para almacenar tokens QR estáticos permanentes de usuarios
CREATE TABLE IF NOT EXISTS tokens_qr (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL,
    token TEXT NOT NULL,
    generado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_tokens_qr_usuario ON tokens_qr(usuario_id);
CREATE INDEX idx_tokens_qr_activo ON tokens_qr(activo);
CREATE INDEX idx_tokens_qr_token ON tokens_qr(token);
