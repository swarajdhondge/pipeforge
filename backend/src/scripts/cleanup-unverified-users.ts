/**
 * Cleanup script to remove unverified user accounts after 48 hours
 * Run this as a scheduled job (cron) or manually
 * 
 * Usage: npx tsx src/scripts/cleanup-unverified-users.ts
 */

import pool from '../config/database';
import logger from '../utils/logger';

const UNVERIFIED_EXPIRY_HOURS = 48;

async function cleanupUnverifiedUsers(): Promise<void> {
  console.log('🧹 Starting cleanup of unverified users...\n');

  try {
    // Find unverified users older than 48 hours (email auth only, not Google OAuth)
    const findQuery = `
      SELECT id, email, created_at 
      FROM users 
      WHERE email_verified = false 
        AND auth_provider = 'email'
        AND created_at < NOW() - INTERVAL '${UNVERIFIED_EXPIRY_HOURS} hours'
    `;
    
    const usersToDelete = await pool.query(findQuery);
    
    if (usersToDelete.rows.length === 0) {
      console.log('✅ No unverified accounts to clean up.\n');
      return;
    }

    console.log(`Found ${usersToDelete.rows.length} unverified account(s) to remove:\n`);
    
    for (const user of usersToDelete.rows) {
      console.log(`  - ${user.email} (created: ${user.created_at})`);
    }
    console.log('');

    // Get user IDs to delete
    const userIds = usersToDelete.rows.map(u => u.id);

    // Delete related data first (foreign key constraints)
    // 1. Delete refresh tokens
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = ANY($1)',
      [userIds]
    );

    // 2. Delete pipe likes
    await pool.query(
      'DELETE FROM pipe_likes WHERE user_id = ANY($1)',
      [userIds]
    );

    // 3. Delete executions
    await pool.query(
      'DELETE FROM executions WHERE user_id = ANY($1)',
      [userIds]
    );

    // 4. Delete secrets
    await pool.query(
      'DELETE FROM secrets WHERE user_id = ANY($1)',
      [userIds]
    );

    // 5. Delete pipe versions for user's pipes
    await pool.query(`
      DELETE FROM pipe_versions 
      WHERE pipe_id IN (SELECT id FROM pipes WHERE user_id = ANY($1))
    `, [userIds]);

    // 6. Delete pipes
    await pool.query(
      'DELETE FROM pipes WHERE user_id = ANY($1)',
      [userIds]
    );

    // 7. Finally delete users
    const deleteResult = await pool.query(
      'DELETE FROM users WHERE id = ANY($1) RETURNING email',
      [userIds]
    );

    console.log(`✅ Deleted ${deleteResult.rowCount} unverified account(s).\n`);
    
    // Log for audit
    logger.info('Cleaned up unverified users', {
      count: deleteResult.rowCount,
      emails: deleteResult.rows.map(r => r.email),
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    logger.error('Failed to cleanup unverified users', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
cleanupUnverifiedUsers()
  .then(() => {
    console.log('Cleanup completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
