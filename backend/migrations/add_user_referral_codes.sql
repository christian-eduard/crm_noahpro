-- Migration: Add referral codes to users table
-- Este archivo añade soporte para códigos de referido en usuarios

-- Añadir columna referral_code
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

-- Añadir columna qr_code_url para almacenar el QR como Data URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Índice para búsqueda rápida por código de referido
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
