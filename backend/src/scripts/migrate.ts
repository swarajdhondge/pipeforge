import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../config/database';

async function runMigrations() {
  const migrations = [
    '001_create_users_table.sql',
    '002_create_refresh_tokens_table.sql',
    '003_create_anonymous_executions_table.sql',
    '004_create_pipes_table.sql',
    '005_create_pipe_versions_table.sql',
    '006_create_executions_table.sql',
    '007_add_email_verification.sql',
    '008_add_is_draft_to_pipes.sql',
    '009_create_secrets_table.sql',
    '010_create_pipe_likes_table.sql',
    '011_add_username_profile.sql',
  ];

  console.log('Running migrations...');

  for (const migration of migrations) {
    const filePath = join(__dirname, '../migrations', migration);
    const sql = readFileSync(filePath, 'utf-8');

    try {
      await pool.query(sql);
      console.log(`✓ ${migration} completed`);
    } catch (error) {
      console.error(`✗ ${migration} failed:`, error);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully!');
  await pool.end();
  process.exit(0);
}

runMigrations();
