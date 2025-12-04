/**
 * Script to check and fix pipe ownership issues
 * Run with: npx tsx src/scripts/check-pipe-ownership.ts <user-email>
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPipeOwnership(userEmail: string) {
  try {
    console.log(`\nChecking pipes for user: ${userEmail}\n`);

    // Get user ID
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

    // Get all pipes for this user
    const pipesResult = await pool.query(
      `SELECT id, name, user_id, is_public, created_at 
       FROM pipes 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    console.log(`Found ${pipesResult.rows.length} pipe(s):\n`);

    for (const pipe of pipesResult.rows) {
      console.log(`Pipe: ${pipe.name}`);
      console.log(`  ID: ${pipe.id}`);
      console.log(`  User ID: ${pipe.user_id}`);
      console.log(`  User ID matches: ${pipe.user_id === user.id ? '✅ YES' : '❌ NO'}`);
      console.log(`  Public: ${pipe.is_public ? 'Yes' : 'No'}`);
      console.log(`  Created: ${pipe.created_at}`);
      console.log('');
    }

    // Check for orphaned pipes (user_id doesn't exist)
    const orphanedResult = await pool.query(
      `SELECT p.id, p.name, p.user_id 
       FROM pipes p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE u.id IS NULL`
    );

    if (orphanedResult.rows.length > 0) {
      console.log(`\n⚠️  Found ${orphanedResult.rows.length} orphaned pipe(s) (user doesn't exist):`);
      for (const pipe of orphanedResult.rows) {
        console.log(`  - ${pipe.name} (ID: ${pipe.id}, user_id: ${pipe.user_id})`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Get email from command line
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: npx tsx src/scripts/check-pipe-ownership.ts <user-email>');
  process.exit(1);
}

checkPipeOwnership(userEmail);
