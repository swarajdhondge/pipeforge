#!/usr/bin/env tsx

/**
 * Environment Validation Script
 * 
 * Validates all required environment variables before deployment.
 * Run this script before deploying to production to catch configuration issues early.
 * 
 * Usage:
 *   npm run validate-env
 *   or
 *   tsx scripts/validate-env.ts
 */

import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';

// Load environment variables
loadEnv();

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: ValidationResult[] = [];

function pass(name: string, message: string) {
  results.push({ name, status: 'pass', message });
}

function fail(name: string, message: string) {
  results.push({ name, status: 'fail', message });
}

function warn(name: string, message: string) {
  results.push({ name, status: 'warn', message });
}

console.log('='.repeat(80));
console.log('Yahoo Pipes 2025 - Environment Validation');
console.log('='.repeat(80));
console.log('');

// 1. Check NODE_ENV
console.log('Checking NODE_ENV...');
const nodeEnv = process.env.NODE_ENV;
if (!nodeEnv) {
  warn('NODE_ENV', 'Not set (defaulting to development)');
} else if (nodeEnv === 'production') {
  pass('NODE_ENV', 'Set to production');
} else {
  warn('NODE_ENV', `Set to ${nodeEnv} (not production)`);
}

// 2. Check PORT
console.log('Checking PORT...');
const port = process.env.PORT;
if (!port) {
  warn('PORT', 'Not set (defaulting to 3000)');
} else if (isNaN(parseInt(port))) {
  fail('PORT', 'Invalid port number');
} else {
  pass('PORT', `Set to ${port}`);
}

// 3. Check DATABASE_URL
console.log('Checking DATABASE_URL...');
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  fail('DATABASE_URL', 'Not set (required)');
} else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  fail('DATABASE_URL', 'Invalid format (must start with postgresql:// or postgres://)');
} else {
  pass('DATABASE_URL', 'Set and valid format');
}

// 4. Check REDIS_URL
console.log('Checking REDIS_URL...');
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  fail('REDIS_URL', 'Not set (required)');
} else if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
  fail('REDIS_URL', 'Invalid format (must start with redis:// or rediss://)');
} else {
  pass('REDIS_URL', 'Set and valid format');
}

// 5. Check JWT_SECRET
console.log('Checking JWT_SECRET...');
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  fail('JWT_SECRET', 'Not set (required)');
} else if (jwtSecret.length < 32) {
  fail('JWT_SECRET', `Too short (${jwtSecret.length} chars, minimum 32 required)`);
} else if (jwtSecret.length < 64) {
  warn('JWT_SECRET', `Weak (${jwtSecret.length} chars, 64+ recommended for production)`);
} else {
  pass('JWT_SECRET', `Strong (${jwtSecret.length} characters)`);
}

// 6. Check SECRETS_ENCRYPTION_KEY (NEW - Phase 3)
console.log('Checking SECRETS_ENCRYPTION_KEY...');
const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
if (!encryptionKey) {
  fail('SECRETS_ENCRYPTION_KEY', 'Not set (required for Phase 3)');
} else if (encryptionKey.length !== 64) {
  fail('SECRETS_ENCRYPTION_KEY', `Invalid length (${encryptionKey.length} chars, must be exactly 64)`);
} else if (!/^[0-9a-f]{64}$/.test(encryptionKey)) {
  fail('SECRETS_ENCRYPTION_KEY', 'Invalid format (must be 64 hexadecimal characters)');
} else {
  pass('SECRETS_ENCRYPTION_KEY', 'Valid (64 hex characters)');
}

// 7. Check DOMAIN_WHITELIST (NEW - Phase 3)
console.log('Checking DOMAIN_WHITELIST...');
const domainWhitelist = process.env.DOMAIN_WHITELIST;
if (!domainWhitelist) {
  warn('DOMAIN_WHITELIST', 'Not set (will use default whitelist)');
} else {
  const domains = domainWhitelist.split(',').map(d => d.trim());
  if (domains.length === 0) {
    warn('DOMAIN_WHITELIST', 'Empty (will use default whitelist)');
  } else {
    pass('DOMAIN_WHITELIST', `${domains.length} domains configured`);
  }
}

// 8. Check FRONTEND_URL
console.log('Checking FRONTEND_URL...');
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  warn('FRONTEND_URL', 'Not set (CORS may not work correctly)');
} else if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
  fail('FRONTEND_URL', 'Invalid format (must start with http:// or https://)');
} else if (nodeEnv === 'production' && frontendUrl.startsWith('http://')) {
  warn('FRONTEND_URL', 'Using HTTP in production (HTTPS recommended)');
} else {
  pass('FRONTEND_URL', 'Set and valid format');
}

// 9. Check Google OAuth (optional)
console.log('Checking Google OAuth configuration...');
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

if (!googleClientId && !googleClientSecret && !googleCallbackUrl) {
  warn('Google OAuth', 'Not configured (optional feature)');
} else if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
  warn('Google OAuth', 'Partially configured (all three variables required)');
} else {
  pass('Google OAuth', 'Fully configured');
}

// 10. Check Storage Provider
console.log('Checking STORAGE_PROVIDER (avatars)...');
const storageProvider = (process.env.STORAGE_PROVIDER || 'database').toLowerCase();
const maxAvatarSize = parseInt(process.env.MAX_AVATAR_SIZE_BYTES || `${2 * 1024 * 1024}`, 10);
const storageDiskRoot = process.env.STORAGE_DISK_ROOT || 'uploads';
const storageDiskAvatarPath = process.env.STORAGE_DISK_AVATAR_PATH || `${storageDiskRoot}/avatars`;
const storagePublicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL || '/uploads';

if (!['database', 's3', 'disk'].includes(storageProvider)) {
  fail('STORAGE_PROVIDER', `Invalid value "${storageProvider}" (use "database", "disk", or "s3")`);
} else if (storageProvider === 'database') {
  pass('STORAGE_PROVIDER', 'database (stores data URLs in Postgres)');
} else if (storageProvider === 'disk') {
  pass('STORAGE_PROVIDER', `disk (root=${storageDiskRoot}, avatars=${storageDiskAvatarPath})`);
  pass('STORAGE_PUBLIC_BASE_URL', storagePublicBaseUrl);
} else {
  const s3Vars = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  const missing = s3Vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    fail('S3 config', `Missing required vars: ${missing.join(', ')}`);
  } else {
    pass('S3 config', 'Bucket/region/credentials present');
    if (process.env.S3_ENDPOINT) {
      pass('S3_ENDPOINT', 'Custom endpoint set (useful for MinIO)');
    } else {
      warn('S3_ENDPOINT', 'Not set (using AWS standard endpoint)');
    }
    if (process.env.S3_PUBLIC_BASE_URL) {
      pass('S3_PUBLIC_BASE_URL', 'Custom public base URL set');
    } else {
      warn('S3_PUBLIC_BASE_URL', 'Not set (will use default AWS pattern)');
    }
  }
}

if (isNaN(maxAvatarSize) || maxAvatarSize <= 0) {
  fail('MAX_AVATAR_SIZE_BYTES', 'Invalid or non-positive number');
} else {
  pass('MAX_AVATAR_SIZE_BYTES', `${maxAvatarSize} bytes`);
}

// 11. Test Database Connection
console.log('Testing database connection...');
async function testDatabase() {
  if (!databaseUrl) {
    fail('Database Connection', 'Skipped (DATABASE_URL not set)');
    return;
  }

  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    pass('Database Connection', 'Successful');
  } catch (error: any) {
    fail('Database Connection', `Failed: ${error.message}`);
  }
}

// 12. Test Redis Connection
console.log('Testing Redis connection...');
async function testRedis() {
  if (!redisUrl) {
    fail('Redis Connection', 'Skipped (REDIS_URL not set)');
    return;
  }

  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    await client.ping();
    await client.quit();
    pass('Redis Connection', 'Successful');
  } catch (error: any) {
    fail('Redis Connection', `Failed: ${error.message}`);
  }
}

// Run async tests
async function runTests() {
  await testDatabase();
  await testRedis();

  // Print results
  console.log('');
  console.log('='.repeat(80));
  console.log('Validation Results');
  console.log('='.repeat(80));
  console.log('');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
    const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'fail' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';
    console.log(`${color}${icon}${reset} ${result.name}: ${result.message}`);
  });

  console.log('');
  console.log('='.repeat(80));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warned} warnings`);
  console.log('='.repeat(80));
  console.log('');

  if (failed > 0) {
    console.error('❌ Validation FAILED - Fix errors before deploying');
    process.exit(1);
  } else if (warned > 0) {
    console.warn('⚠️  Validation passed with warnings - Review before deploying');
    process.exit(0);
  } else {
    console.log('✅ Validation PASSED - Ready for deployment');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});
