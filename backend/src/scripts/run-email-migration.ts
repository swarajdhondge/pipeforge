import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Admin@123@localhost:5432/pipes_dev',
});

async function runMigration() {
  console.log('Running email verification migration...');
  
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
    `);
    
    await pool.query(`UPDATE users SET email_verified = true WHERE auth_provider = 'google'`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
