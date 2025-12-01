-- Add is_draft column to pipes table
ALTER TABLE pipes ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Create index for draft queries
CREATE INDEX IF NOT EXISTS idx_pipes_is_draft ON pipes(is_draft);

-- Create composite index for user's drafts
CREATE INDEX IF NOT EXISTS idx_pipes_user_drafts ON pipes(user_id, is_draft) WHERE is_draft = true;

-- Update existing pipes to be non-drafts (published)
UPDATE pipes SET is_draft = false WHERE is_draft IS NULL;

