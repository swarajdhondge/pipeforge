-- Create secrets table for encrypted API keys and tokens
CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_secret_name UNIQUE (user_id, name),
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_secrets_user_id ON secrets(user_id);

-- Add comments for documentation
COMMENT ON TABLE secrets IS 'Encrypted API keys and tokens for authenticated API access';
COMMENT ON COLUMN secrets.encrypted_value IS 'AES-256-GCM encrypted value (format: iv:authTag:encrypted)';
COMMENT ON COLUMN secrets.user_id IS 'Foreign key to users table with CASCADE delete';
COMMENT ON COLUMN secrets.name IS 'User-defined name for the secret (must be unique per user)';
