/**
 * Test script for secrets service
 * Run with: npx ts-node src/scripts/test-secrets-service.ts
 */

import pool from '../config/database';
import { SecretsService } from '../services/secrets.service';

async function testSecretsService() {
  console.log('Testing Secrets Service...\n');

  const secretsService = new SecretsService(pool);
  const testUserId = '00000000-0000-0000-0000-000000000001'; // Test user ID

  try {
    // Test 1: Create secret
    console.log('Test 1: Create secret');
    const secret1 = await secretsService.create(testUserId, {
      name: 'Test GitHub Token',
      description: 'Test token for GitHub API',
      value: 'ghp_test123456789abcdefghijklmnopqrstuvwxyz',
    });
    console.log(`  ✓ Created secret: ${secret1.name} (${secret1.id})`);
    console.log(`  ✓ Metadata does not contain encrypted_value: ${!('encrypted_value' in secret1)}\n`);

    // Test 2: List secrets
    console.log('Test 2: List secrets');
    const secrets = await secretsService.list(testUserId);
    console.log(`  ✓ Found ${secrets.length} secret(s)`);
    console.log(`  ✓ All secrets are metadata only: ${secrets.every(s => !('encrypted_value' in s))}\n`);

    // Test 3: Get secret
    console.log('Test 3: Get secret');
    const secret2 = await secretsService.get(secret1.id, testUserId);
    console.log(`  ✓ Retrieved secret: ${secret2?.name}`);
    console.log(`  ✓ Metadata does not contain encrypted_value: ${secret2 && !('encrypted_value' in secret2)}\n`);

    // Test 4: Decrypt secret
    console.log('Test 4: Decrypt secret');
    const decrypted = await secretsService.decrypt(secret1.id, testUserId);
    console.log(`  ✓ Decrypted value matches original: ${decrypted === 'ghp_test123456789abcdefghijklmnopqrstuvwxyz'}\n`);

    // Test 5: Validate secret
    console.log('Test 5: Validate secret');
    const isValid = await secretsService.validate(secret1.id, testUserId);
    console.log(`  ✓ Secret is valid: ${isValid}\n`);

    // Test 6: Update secret (name and description)
    console.log('Test 6: Update secret (name and description)');
    const updated1 = await secretsService.update(secret1.id, testUserId, {
      name: 'Updated GitHub Token',
      description: 'Updated description',
    });
    console.log(`  ✓ Updated secret name: ${updated1.name}`);
    console.log(`  ✓ Updated secret description: ${updated1.description}\n`);

    // Test 7: Update secret (value)
    console.log('Test 7: Update secret (value)');
    await secretsService.update(secret1.id, testUserId, {
      value: 'ghp_newtoken987654321',
    });
    const newDecrypted = await secretsService.decrypt(secret1.id, testUserId);
    console.log(`  ✓ Updated value decrypts correctly: ${newDecrypted === 'ghp_newtoken987654321'}\n`);

    // Test 8: Create duplicate secret (should fail)
    console.log('Test 8: Create duplicate secret (should fail)');
    try {
      await secretsService.create(testUserId, {
        name: 'Updated GitHub Token', // Same name as updated secret
        value: 'test',
      });
      console.log('  ✗ Should have thrown error\n');
    } catch (error) {
      console.log(`  ✓ Correctly threw error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    // Test 9: Get non-existent secret
    console.log('Test 9: Get non-existent secret');
    const nonExistent = await secretsService.get('00000000-0000-0000-0000-000000000099', testUserId);
    console.log(`  ✓ Returns null for non-existent secret: ${nonExistent === null}\n`);

    // Test 10: Validate non-existent secret
    console.log('Test 10: Validate non-existent secret');
    const isInvalid = await secretsService.validate('00000000-0000-0000-0000-000000000099', testUserId);
    console.log(`  ✓ Returns false for non-existent secret: ${!isInvalid}\n`);

    // Test 11: Delete secret
    console.log('Test 11: Delete secret');
    await secretsService.delete(secret1.id, testUserId);
    const deletedSecret = await secretsService.get(secret1.id, testUserId);
    console.log(`  ✓ Secret deleted successfully: ${deletedSecret === null}\n`);

    // Test 12: Decrypt deleted secret (should fail)
    console.log('Test 12: Decrypt deleted secret (should fail)');
    try {
      await secretsService.decrypt(secret1.id, testUserId);
      console.log('  ✗ Should have thrown error\n');
    } catch (error) {
      console.log(`  ✓ Correctly threw error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('All tests completed successfully! ✓');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testSecretsService();
