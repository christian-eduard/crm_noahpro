-- Migración para sincronizar hunter_usage_stats con los endpoints de admin
-- Añadiendo columnas: searches_performed, demos_generated

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hunter_usage_stats' AND column_name='searches_performed') THEN
        ALTER TABLE hunter_usage_stats ADD COLUMN searches_performed integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hunter_usage_stats' AND column_name='demos_generated') THEN
        ALTER TABLE hunter_usage_stats ADD COLUMN demos_generated integer DEFAULT 0;
    END IF;
END $$;
