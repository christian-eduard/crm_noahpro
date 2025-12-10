ALTER TABLE crm_settings 
ADD COLUMN IF NOT EXISTS pusher_app_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS pusher_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS pusher_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS pusher_cluster VARCHAR(50) DEFAULT 'eu';

-- Seed default values if provided (optional, but good for testing)
UPDATE crm_settings 
SET pusher_app_id = '2086108',
    pusher_key = '0815d25ee2bae406d7d9',
    pusher_secret = 'b9c8bd2bdf4dccd881f8',
    pusher_cluster = 'eu'
WHERE id = (SELECT id FROM crm_settings ORDER BY id DESC LIMIT 1);
