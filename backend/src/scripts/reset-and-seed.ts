/**
 * Reset and Seed Database Script
 * 
 * Combines reset, migrate, and seed into one command
 * WARNING: This will delete ALL data!
 */

import { execSync } from 'child_process';

async function resetAndSeed() {
  try {
    console.log('🔄 Starting database reset and seed process...\n');

    // Step 1: Reset database
    console.log('Step 1/4: Resetting database...');
    execSync('npx tsx src/scripts/reset-db.ts', { stdio: 'inherit' });

    // Step 2: Run migrations
    console.log('\nStep 2/4: Running migrations...');
    execSync('npm run migrate', { stdio: 'inherit' });

    // Step 3: Seed database
    console.log('\nStep 3/4: Seeding database...');
    execSync('npx tsx src/scripts/seed-db.ts', { stdio: 'inherit' });

    // Step 4: Clear cache
    console.log('\nStep 4/4: Clearing Redis cache...');
    execSync('npm run cache:clear', { stdio: 'inherit' });

    console.log('\n✅ Database reset, seeded, and cache cleared successfully!');

  } catch (error) {
    console.error('❌ Error during reset and seed:', error);
    process.exit(1);
  }
}

resetAndSeed();
