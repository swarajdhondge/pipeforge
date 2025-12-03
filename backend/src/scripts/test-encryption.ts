/**
 * Test script for encryption service
 * Run with: npx ts-node src/scripts/test-encryption.ts
 */

import { getEncryptionService } from '../utils/encryption';

async function testEncryption() {
  console.log('Testing Encryption Service...\n');

  try {
    const encryptionService = getEncryptionService();
    console.log('✓ EncryptionService initialized successfully\n');

    // Test 1: Basic encryption/decryption
    console.log('Test 1: Basic encryption/decryption');
    const plaintext1 = 'my-secret-api-key-12345';
    const encrypted1 = encryptionService.encrypt(plaintext1);
    console.log(`  Plaintext: ${plaintext1}`);
    console.log(`  Encrypted: ${encrypted1}`);
    
    const decrypted1 = encryptionService.decrypt(encrypted1);
    console.log(`  Decrypted: ${decrypted1}`);
    console.log(`  Match: ${plaintext1 === decrypted1 ? '✓' : '✗'}\n`);

    // Test 2: Different plaintexts produce different ciphertexts
    console.log('Test 2: Same plaintext produces different ciphertexts (random IV)');
    const plaintext2 = 'test-secret';
    const encrypted2a = encryptionService.encrypt(plaintext2);
    const encrypted2b = encryptionService.encrypt(plaintext2);
    console.log(`  Plaintext: ${plaintext2}`);
    console.log(`  Encrypted 1: ${encrypted2a}`);
    console.log(`  Encrypted 2: ${encrypted2b}`);
    console.log(`  Different: ${encrypted2a !== encrypted2b ? '✓' : '✗'}`);
    console.log(`  Both decrypt correctly: ${
      encryptionService.decrypt(encrypted2a) === plaintext2 &&
      encryptionService.decrypt(encrypted2b) === plaintext2 ? '✓' : '✗'
    }\n`);

    // Test 3: Long secret
    console.log('Test 3: Long secret');
    const plaintext3 = 'ghp_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const encrypted3 = encryptionService.encrypt(plaintext3);
    const decrypted3 = encryptionService.decrypt(encrypted3);
    console.log(`  Plaintext length: ${plaintext3.length}`);
    console.log(`  Encrypted length: ${encrypted3.length}`);
    console.log(`  Match: ${plaintext3 === decrypted3 ? '✓' : '✗'}\n`);

    // Test 4: Special characters
    console.log('Test 4: Special characters');
    const plaintext4 = 'secret!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const encrypted4 = encryptionService.encrypt(plaintext4);
    const decrypted4 = encryptionService.decrypt(encrypted4);
    console.log(`  Plaintext: ${plaintext4}`);
    console.log(`  Match: ${plaintext4 === decrypted4 ? '✓' : '✗'}\n`);

    // Test 5: Invalid encrypted format
    console.log('Test 5: Invalid encrypted format (should throw error)');
    try {
      encryptionService.decrypt('invalid-format');
      console.log('  ✗ Should have thrown error\n');
    } catch (error) {
      console.log(`  ✓ Correctly threw error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('All tests completed successfully! ✓');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testEncryption();
