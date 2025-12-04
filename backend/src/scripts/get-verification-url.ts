import pool from '../config/database';

async function getVerificationUrl() {
  const email = process.argv[2] || 'kaaate009@gmail.com';
  
  const result = await pool.query(
    'SELECT email, verification_token FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows[0] && result.rows[0].verification_token) {
    console.log(`\nVerification URL for ${email}:`);
    console.log(`http://localhost:5173/verify-email?token=${result.rows[0].verification_token}\n`);
  } else {
    console.log(`No verification token found for ${email}`);
  }
  
  await pool.end();
}

getVerificationUrl();
