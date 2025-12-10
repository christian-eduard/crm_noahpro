-- Migración: Sistema de Formación y Soporte para Comerciales
-- Fecha: 2025-12-10

-- ===========================================
-- TABLA: Materiales de Formación
-- ===========================================
CREATE TABLE IF NOT EXISTS training_materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'document', 'tutorial', 'link')),
    -- Para archivos subidos
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    -- Para videos (YouTube, Vimeo, etc)
    video_url TEXT,
    -- Para tutoriales (contenido HTML rico)
    content TEXT,
    -- Para enlaces externos
    external_url TEXT,
    -- Visibilidad
    is_public BOOLEAN DEFAULT true, -- true = todos, false = específico
    commercial_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL = público
    -- Ordenación y categoría
    category VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    -- Metadatos
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_materials_public ON training_materials(is_public);
CREATE INDEX IF NOT EXISTS idx_training_materials_commercial ON training_materials(commercial_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON training_materials(type);

-- ===========================================
-- TABLA: Tickets de Soporte
-- ===========================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    commercial_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_commercial ON support_tickets(commercial_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- ===========================================
-- TABLA: Mensajes de Tickets
-- ===========================================
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    -- Adjuntos opcionales
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    -- Metadatos
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
