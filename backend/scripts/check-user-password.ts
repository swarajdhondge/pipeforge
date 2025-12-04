import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUserPassword(email: string, password: string) {
  try {
    console.log(`\n🔍 Checking password for: ${email}`);
    console.log(`Password to test: ${password}`);
    console.log(`Password length: ${password.length}`);
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, password_hash, reset_token, reset_token_expires, email_verified, auth_provider FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('\n📋 User details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Auth Provider: ${user.auth_provider}`);
    console.log(`  Email Verified: ${user.email_verified}`);
    console.log(`  Has Password Hash: ${!!user.password_hash}`);
    console.log(`  Reset Token: ${user.reset_token ? 'Present' : 'None'}`);
    console.log(`  Reset Token Expires: ${user.reset_token_expires || 'N/A'}`);

    if (!user.password_hash) {
      console.log('\n❌ No password hash found - this might be an OAuth-only account');
      return;
    }

    // Test password
    console.log('\n🔐 Testing password...');
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      console.log('✅ Password is CORRECT');
    } else {
      console.log('❌ Password is INCORRECT');
      
      // Try to hash the provided password and compare hashes
      const testHash = await bcrypt.hash(password, 10);
      console.log('\n🔬 Debug info:');
      console.log(`  Stored hash: ${user.password_hash.substring(0, 20)}...`);
      console.log(`  Test hash: ${testHash.substring(0, 20)}...`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: npm run check-password <email> <password>');
  process.exit(1);
}

checkUserPassword(email, password);
