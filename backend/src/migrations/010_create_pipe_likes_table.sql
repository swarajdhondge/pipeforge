-- Create pipe_likes table
CREATE TABLE IF NOT EXISTS pipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_id UUID NOT NULL REFERENCES pipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pipe_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pipe_likes_pipe_id ON pipe_likes(pipe_id);
CREATE INDEX IF NOT EXISTS idx_pipe_likes_user_id ON pipe_likes(user_id);
