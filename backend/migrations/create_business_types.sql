-- =====================================================
-- MIGRACIÓN: Tabla de Tipos de Negocio (Lead Hunter)
-- =====================================================

CREATE TABLE business_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'Building', -- Nombre del icono Lucide
    google_query VARCHAR(200), -- Término de búsqueda optimizado para Google Maps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Datos iniciales (sin emojis, usando iconos Lucide)
INSERT INTO business_types (name, icon, google_query) VALUES
('Restaurantes', 'Utensils', 'restaurant'),
('Cafeterías', 'Coffee', 'cafe coffee shop'),
('Bares', 'Wine', 'bar pub'),
('Hoteles', 'Hotel', 'hotel lodging'),
('Tiendas de Ropa', 'ShoppingBag', 'clothing store fashion'),
('Gimnasios', 'Dumbbell', 'gym fitness center'),
('Farmacias', 'Pill', 'pharmacy drugstore'),
('Inmobiliarias', 'Home', 'real estate agency'),
('Talleres Mecánicos', 'Wrench', 'car repair mechanic'),
('Peluquerías', 'Scissors', 'hair salon barber'),
('Clínicas Dentales', 'Stethoscope', 'dentist dental clinic'),
('Supermercados', 'ShoppingCart', 'supermarket grocery store');

-- Verificar
SELECT * FROM business_types ORDER BY name;
