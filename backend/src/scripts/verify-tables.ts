import pool from '../config/database';

async function verifyTables() {
  const tables = [
    'users',
    'refresh_tokens',
    'anonymous_executions',
    'pipes',
    'pipe_versions',
    'executions',
    'pipe_likes',
  ];

  console.log('Verifying database tables...\n');

  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      const exists = result.rows[0].exists;
      console.log(`${exists ? '✓' : '✗'} ${table}: ${exists ? 'exists' : 'missing'}`);
    } catch (error) {
      console.error(`✗ Error checking ${table}:`, error);
    }
  }

  console.log('\nVerification complete!');
  await pool.end();
  process.exit(0);
}

verifyTables();
