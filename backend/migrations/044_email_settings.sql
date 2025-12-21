-- Fase 6: Infraestructura Técnica - Configuración de Email
-- Tabla para almacenar settings SMTP personalizados

CREATE TABLE IF NOT EXISTS email_settings (
    id SERIAL PRIMARY KEY,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password TEXT NOT NULL,  -- Cifrado recomendado en producción
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) DEFAULT 'NoahPro CRM',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Solo una configuración activa a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_settings_active ON email_settings(is_active) WHERE is_active = true;

-- Comentarios
COMMENT ON TABLE email_settings IS 'Configuración SMTP para envío de emails automáticos';
COMMENT ON COLUMN email_settings.smtp_password IS 'Contraseña SMTP (recomendado cifrar con AES-256)';
