ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone;
