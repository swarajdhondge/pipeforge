/**
 * Reset Database Script
 * 
 * Drops all tables and re-runs migrations
 * WARNING: This will delete ALL data!
 */

import { Pool } from 'pg';
import { config } from '../config/env';
// import logger from '../utils/logger';

async function resetDatabase() {
  const pool = new Pool({
    connectionString: config.databaseUrl,
  });

  try {
    console.log('🗑️  Dropping all tables...');

    // Drop tables in reverse order (respecting foreign keys)
    await pool.query('DROP TABLE IF EXISTS secrets CASCADE');
    await pool.query('DROP TABLE IF EXISTS pipe_likes CASCADE');
    await pool.query('DROP TABLE IF EXISTS executions CASCADE');
    await pool.query('DROP TABLE IF EXISTS pipe_versions CASCADE');
    await pool.query('DROP TABLE IF EXISTS pipes CASCADE');
    await pool.query('DROP TABLE IF EXISTS anonymous_executions CASCADE');
    await pool.query('DROP TABLE IF EXISTS refresh_tokens CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('✅ All tables dropped');

    await pool.end();

    console.log('\n📦 Run migrations to recreate tables:');
    console.log('   npm run migrate');
    console.log('\n🌱 Then seed the database:');
    console.log('   npm run seed');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
