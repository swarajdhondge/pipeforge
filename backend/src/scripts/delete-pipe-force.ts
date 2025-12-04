/**
 * Script to force delete a pipe (bypassing ownership checks)
 * Run with: npx tsx src/scripts/delete-pipe-force.ts <pipe-id>
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function deletePipeForce(pipeId: string) {
  try {
    console.log(`\nAttempting to delete pipe: ${pipeId}\n`);

    // Get pipe info first
    const pipeResult = await pool.query(
      'SELECT id, name, user_id, is_public FROM pipes WHERE id = $1',
      [pipeId]
    );

    if (pipeResult.rows.length === 0) {
      console.log('❌ Pipe not found');
      return;
    }

    const pipe = pipeResult.rows[0];
    console.log(`Found pipe: ${pipe.name}`);
    console.log(`  ID: ${pipe.id}`);
    console.log(`  User ID: ${pipe.user_id}`);
    console.log(`  Public: ${pipe.is_public ? 'Yes' : 'No'}`);
    console.log('');

    // Delete the pipe
    await pool.query('DELETE FROM pipes WHERE id = $1', [pipeId]);

    console.log('✅ Pipe deleted successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Get pipe ID from command line
const pipeId = process.argv[2];

if (!pipeId) {
  console.log('Usage: npx tsx src/scripts/delete-pipe-force.ts <pipe-id>');
  process.exit(1);
}

deletePipeForce(pipeId);
