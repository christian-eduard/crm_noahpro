-- Migración: Crear tabla de notificaciones
-- Fecha: 2025-12-03

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES crm_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_lead', 'proposal_viewed', 'proposal_accepted', 'new_comment', 'chat_message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500), -- URL para navegar al hacer click
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
