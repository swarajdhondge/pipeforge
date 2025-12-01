-- Create pipes table
CREATE TABLE IF NOT EXISTS pipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,  -- { nodes: [], edges: [] }
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  like_count INTEGER DEFAULT 0,
  execution_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  forked_from UUID REFERENCES pipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pipes_user_id ON pipes(user_id);
CREATE INDEX IF NOT EXISTS idx_pipes_is_public ON pipes(is_public);
CREATE INDEX IF NOT EXISTS idx_pipes_tags ON pipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_pipes_featured ON pipes(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_pipes_forked_from ON pipes(forked_from);
