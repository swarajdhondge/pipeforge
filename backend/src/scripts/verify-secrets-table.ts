/**
 * Verify secrets table was created correctly
 * Run with: npx ts-node src/scripts/verify-secrets-table.ts
 */

import pool from '../config/database';

async function verifySecretsTable() {
  console.log('Verifying secrets table...\n');

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'secrets'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('✗ Secrets table does not exist');
      process.exit(1);
    }

    console.log('✓ Secrets table exists\n');

    // Check columns
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'secrets'
      ORDER BY ordinal_position;
    `);

    console.log('Columns:');
    columnsQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log();

    // Check constraints
    const constraintsQuery = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'secrets';
    `);

    console.log('Constraints:');
    constraintsQuery.rows.forEach(con => {
      console.log(`  - ${con.constraint_name}: ${con.constraint_type}`);
    });
    console.log();

    // Check indexes
    const indexesQuery = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'secrets';
    `);

    console.log('Indexes:');
    indexesQuery.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    console.log();

    // Check foreign key
    const fkQuery = await pool.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'secrets' AND tc.constraint_type = 'FOREIGN KEY';
    `);

    console.log('Foreign Keys:');
    fkQuery.rows.forEach(fk => {
      console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      console.log(`    ON DELETE ${fk.delete_rule}`);
    });
    console.log();

    console.log('✓ All verifications passed!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    await pool.end();
    process.exit(1);
  }
}

verifySecretsTable();
