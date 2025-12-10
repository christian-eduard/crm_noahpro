-- Migración: Módulo de Comerciales
-- Fecha: 2025-12-03

-- 1. Tabla de Perfiles de Comerciales
CREATE TABLE IF NOT EXISTS commercial_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    commercial_code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    qr_code_url TEXT,
    card_front_url TEXT, -- URL personalizada si se sube una específica
    card_back_url TEXT,  -- URL generada
    status VARCHAR(50) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Plantillas de Tarjetas
CREATE TABLE IF NOT EXISTS commercial_card_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    front_image_url TEXT NOT NULL, -- La imagen base delantera
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Planes de Comisiones
CREATE TABLE IF NOT EXISTS commission_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Tramos de Comisiones
CREATE TABLE IF NOT EXISTS commission_segments (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES commission_plans(id) ON DELETE CASCADE,
    min_sales INTEGER NOT NULL,
    max_sales INTEGER, -- NULL significa "en adelante"
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Materiales de Formación
CREATE TABLE IF NOT EXISTS training_materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- video, pdf, document, link
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_commercial_profiles_user_id ON commercial_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_profiles_code ON commercial_profiles(commercial_code);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON training_materials(type);

-- 7. Trigger para updated_at (reutilizando la función existente)
DROP TRIGGER IF EXISTS commercial_profiles_updated_at_trigger ON commercial_profiles;
CREATE TRIGGER commercial_profiles_updated_at_trigger
    BEFORE UPDATE ON commercial_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS commission_plans_updated_at_trigger ON commission_plans;
CREATE TRIGGER commission_plans_updated_at_trigger
    BEFORE UPDATE ON commission_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS training_materials_updated_at_trigger ON training_materials;
CREATE TRIGGER training_materials_updated_at_trigger
    BEFORE UPDATE ON training_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insertar plan de comisiones por defecto
INSERT INTO commission_plans (name, description) VALUES
('Plan Estándar 2025', 'Plan de comisiones base para nuevos comerciales')
ON CONFLICT DO NOTHING;

-- Insertar tramos por defecto (asumiendo que el ID 1 es el plan insertado)
-- Nota: En un script real de producción, deberíamos buscar el ID, pero para inicialización asumiendo DB limpia o controlada:
DO $$
DECLARE
    plan_id_val INTEGER;
BEGIN
    SELECT id INTO plan_id_val FROM commission_plans WHERE name = 'Plan Estándar 2025' LIMIT 1;
    
    IF plan_id_val IS NOT NULL THEN
        INSERT INTO commission_segments (plan_id, min_sales, max_sales, amount) VALUES
        (plan_id_val, 0, 10, 40.00),
        (plan_id_val, 11, 50, 50.00),
        (plan_id_val, 51, NULL, 60.00);
    END IF;
END $$;
