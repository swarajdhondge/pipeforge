-- Cleanup script for pipe ownership issues
-- Run with: psql <your-database-url> -f src/scripts/cleanup-database.sql

-- 1. Show all pipes with their owners
SELECT 
  p.id,
  p.name,
  p.user_id,
  u.email as owner_email,
  p.is_public,
  p.created_at
FROM pipes p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- 2. Find orphaned pipes (user doesn't exist)
SELECT 
  p.id,
  p.name,
  p.user_id,
  'ORPHANED - User does not exist' as issue
FROM pipes p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- 3. Delete orphaned pipes (uncomment to execute)
-- DELETE FROM pipes 
-- WHERE id IN (
--   SELECT p.id 
--   FROM pipes p
--   LEFT JOIN users u ON p.user_id = u.id
--   WHERE u.id IS NULL
-- );

-- 4. Show count of pipes per user
SELECT 
  u.email,
  COUNT(p.id) as pipe_count
FROM users u
LEFT JOIN pipes p ON u.id = p.user_id
GROUP BY u.email
ORDER BY pipe_count DESC;
