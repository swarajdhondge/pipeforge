-- Migration: Add username, display_name, bio, avatar_url to users table
-- Date: 2025-12-04
-- Purpose: Support user privacy (username instead of email) and profile features

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add slug column to pipes for friendly URLs
ALTER TABLE pipes ADD COLUMN IF NOT EXISTS slug VARCHAR(150);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_pipes_slug ON pipes(slug);

-- Backfill usernames from email for existing users
UPDATE users 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL;

-- Handle duplicate usernames by adding numeric suffix
DO $$
DECLARE
  dup_username VARCHAR(50);
  user_id UUID;
  counter INT;
BEGIN
  -- Find users with duplicate usernames
  FOR dup_username IN 
    SELECT username FROM users GROUP BY username HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    FOR user_id IN 
      SELECT id FROM users WHERE username = dup_username ORDER BY created_at OFFSET 1
    LOOP
      UPDATE users SET username = dup_username || counter WHERE id = user_id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Set display_name from username for existing users
UPDATE users 
SET display_name = INITCAP(username)
WHERE display_name IS NULL AND username IS NOT NULL;

-- Generate slugs for existing pipes
UPDATE pipes 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Now make username NOT NULL after backfill
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

