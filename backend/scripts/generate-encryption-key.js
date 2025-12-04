#!/usr/bin/env node

/**
 * Generate Encryption Key for Secrets Management
 * 
 * This script generates a cryptographically secure 256-bit (32-byte) encryption key
 * for use with the secrets management system.
 * 
 * Usage:
 *   node scripts/generate-encryption-key.js
 * 
 * Output:
 *   64 hexadecimal characters (32 bytes)
 * 
 * IMPORTANT:
 *   - Store this key securely (password manager, secrets vault)
 *   - Never commit to version control
 *   - Never share or expose publicly
 *   - Losing this key means all secrets become unrecoverable
 *   - Changing this key requires re-encrypting all secrets
 */

const crypto = require('crypto');

console.log('='.repeat(80));
console.log('Yahoo Pipes 2025 - Encryption Key Generator');
console.log('='.repeat(80));
console.log('');

// Generate 32 bytes (256 bits) of random data
const key = crypto.randomBytes(32).toString('hex');

console.log('Generated Encryption Key:');
console.log('');
console.log(key);
console.log('');
console.log('='.repeat(80));
console.log('IMPORTANT SECURITY NOTES:');
console.log('='.repeat(80));
console.log('');
console.log('1. Store this key securely in your password manager or secrets vault');
console.log('2. Add to your production .env file as: SECRETS_ENCRYPTION_KEY=' + key);
console.log('3. NEVER commit this key to version control');
console.log('4. NEVER share this key with anyone');
console.log('5. Losing this key means all encrypted secrets become unrecoverable');
console.log('6. Changing this key requires re-encrypting all existing secrets');
console.log('');
console.log('='.repeat(80));
console.log('');

// Verify key length
if (key.length !== 64) {
  console.error('ERROR: Generated key is not 64 characters!');
  process.exit(1);
}

// Verify key is valid hex
if (!/^[0-9a-f]{64}$/.test(key)) {
  console.error('ERROR: Generated key is not valid hexadecimal!');
  process.exit(1);
}

console.log('✓ Key validation passed');
console.log('✓ Key length: 64 characters (32 bytes)');
console.log('✓ Key format: Valid hexadecimal');
console.log('');
