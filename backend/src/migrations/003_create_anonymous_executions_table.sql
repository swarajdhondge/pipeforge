-- Create anonymous_executions table
CREATE TABLE IF NOT EXISTS anonymous_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  execution_count INT DEFAULT 0,
  last_execution_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_anonymous_executions_session_id ON anonymous_executions(session_id);
