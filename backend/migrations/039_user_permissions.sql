-- Fase 3: Gestión de Equipo & Permisos Granulares
-- Añadir columnas de permisos granulares a la tabla users

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_make_calls BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_access_dojo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_export_data BOOLEAN DEFAULT false;

-- Solo los admins tienen acceso completo por defecto
UPDATE users 
SET can_make_calls = true, 
    can_access_dojo = true, 
    can_export_data = true 
WHERE role = 'admin';

-- Crear índice para consultas rápidas de permisos
CREATE INDEX IF NOT EXISTS idx_users_permissions 
ON users (can_make_calls, can_access_dojo, can_export_data);

-- Comentarios para documentación
COMMENT ON COLUMN users.can_make_calls IS 'Permiso para realizar llamadas desde el softphone integrado';
COMMENT ON COLUMN users.can_access_dojo IS 'Permiso para acceder al simulador de ventas "El Dojo"';
COMMENT ON COLUMN users.can_export_data IS 'Permiso para exportar datos de leads y prospectos';
