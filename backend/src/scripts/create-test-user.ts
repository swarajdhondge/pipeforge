import pool from '../config/database';

async function createTestUser() {
  try {
    await pool.query(`
      INSERT INTO users (id, email, password_hash, auth_provider)
      VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'hash', 'email')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('Test user created or already exists');
    await pool.end();
  } catch (error) {
    console.error('Failed to create test user:', error);
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
