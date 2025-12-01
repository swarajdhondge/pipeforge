-- Create pipe_versions table
CREATE TABLE IF NOT EXISTS pipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_id UUID NOT NULL REFERENCES pipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  definition JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pipe_versions_pipe_id ON pipe_versions(pipe_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipe_versions_unique ON pipe_versions(pipe_id, version_number);
