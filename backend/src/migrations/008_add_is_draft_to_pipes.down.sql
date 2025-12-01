-- Remove is_draft column from pipes table
DROP INDEX IF EXISTS idx_pipes_user_drafts;
DROP INDEX IF EXISTS idx_pipes_is_draft;
ALTER TABLE pipes DROP COLUMN IF EXISTS is_draft;

