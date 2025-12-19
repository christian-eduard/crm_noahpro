-- =====================================================
-- MIGRACIÓN: Unificar tablas de usuarios
-- De: crm_users + users -> users (única tabla)
-- =====================================================

-- Paso 1: Añadir columna password_hash a users si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Paso 2: Migrar passwords de crm_users a users (matching por username)
UPDATE users u
SET password_hash = cu.password_hash
FROM crm_users cu
WHERE u.username = cu.username
  AND u.password_hash IS NULL;

-- Paso 3: Para usuarios en crm_users que NO existen en users, crearlos
INSERT INTO users (username, password, email, full_name, role, password_hash, notifications_enabled, has_lead_hunter_access)
SELECT 
    cu.username,
    '', -- password vacío (usamos password_hash)
    cu.email,
    cu.username, -- full_name 
    cu.role,
    cu.password_hash,
    true,
    CASE WHEN cu.role = 'admin' THEN true ELSE false END
FROM crm_users cu
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.username = cu.username
);

-- Paso 4: Actualizar foreign keys de notifications para usar users.id
-- Primero crear columna temporal
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS new_user_id INTEGER;

-- Mapear IDs de crm_users a users usando username
UPDATE notifications n
SET new_user_id = u.id
FROM crm_users c, users u
WHERE n.user_id = c.id
  AND c.username = u.username;

-- Eliminar foreign key constraint antiguo
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Actualizar columna user_id con los nuevos IDs
UPDATE notifications SET user_id = new_user_id WHERE new_user_id IS NOT NULL;

-- Eliminar columna temporal
ALTER TABLE notifications DROP COLUMN IF EXISTS new_user_id;

-- Añadir nuevo foreign key a users
ALTER TABLE notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Paso 5: Similar para activities si tiene FK a crm_users
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

UPDATE activities a
SET user_id = u.id
FROM crm_users c, users u
WHERE a.user_id = c.id
  AND c.username = u.username;

ALTER TABLE activities 
    ADD CONSTRAINT activities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- Paso 6: Verificar migración
SELECT 'VERIFICACIÓN - Usuarios en tabla users:' as info;
SELECT id, username, email, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'OK' ELSE 'FALTA' END as password_status,
       has_lead_hunter_access
FROM users 
ORDER BY id;

-- Paso 7: PELIGRO - Renombrar tabla crm_users (backup)
-- SOLO EJECUTAR DESPUÉS DE VERIFICAR QUE TODO FUNCIONA
-- ALTER TABLE crm_users RENAME TO crm_users_backup;

SELECT 'MIGRACIÓN COMPLETADA - Verificar y luego descomentar línea para backup crm_users' as status;
