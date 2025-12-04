/**
 * Test Runner Script
 * 
 * Runs all available test scripts and reports results
 */

import { execSync } from 'child_process';
import logger from '../utils/logger';

interface TestScript {
  name: string;
  command: string;
  description: string;
}

const testScripts: TestScript[] = [
  {
    name: 'Backward Compatibility',
    command: 'npx ts-node src/scripts/test-backward-compatibility.ts',
    description: 'Validates that Phase 2 functionality still works after Phase 3 changes'
  },
  {
    name: 'Encryption',
    command: 'npx ts-node src/scripts/test-encryption.ts',
    description: 'Tests encryption/decryption functionality'
  },
  {
    name: 'Domain Whitelist',
    command: 'npx ts-node src/scripts/test-domain-whitelist.ts',
    description: 'Tests domain whitelist validation'
  }
];

async function main() {
  console.log('='.repeat(60));
  console.log('RUNNING ALL TESTS');
  console.log('='.repeat(60));
  console.log('');

  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  for (const test of testScripts) {
    console.log(`\n📋 Running: ${test.name}`);
    console.log(`   ${test.description}`);
    console.log('-'.repeat(60));

    try {
      execSync(test.command, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      results.push({ name: test.name, passed: true });
      console.log(`✅ ${test.name} PASSED\n`);
    } catch (error: any) {
      results.push({ name: test.name, passed: false, error: error.message });
      console.log(`❌ ${test.name} FAILED\n`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal Test Suites: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Test Suites:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('Phase 3 implementation is ready for deployment.');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('Please fix the failing tests before proceeding.');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Test runner failed', { error: error.message });
  process.exit(1);
});

