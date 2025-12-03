/**
 * Test script for domain whitelist
 * Run with: npx ts-node src/scripts/test-domain-whitelist.ts
 */

import { getDomainWhitelist } from '../utils/domain-whitelist';

function testDomainWhitelist() {
  console.log('Testing Domain Whitelist...\n');

  const whitelist = getDomainWhitelist();

  // Display current whitelist
  console.log('Current Whitelist:');
  whitelist.getWhitelist().forEach(domain => {
    console.log(`  - ${domain}`);
  });
  console.log();

  // Test cases
  const testCases = [
    // Whitelisted domains (should pass)
    { url: 'https://api.github.com/users/octocat', expected: true, description: 'Whitelisted domain' },
    { url: 'https://api.github.com/repos/owner/repo', expected: true, description: 'Whitelisted domain with path' },
    { url: 'https://jsonplaceholder.typicode.com/posts', expected: true, description: 'Whitelisted domain' },
    { url: 'https://api.openweathermap.org/data/2.5/weather', expected: true, description: 'Whitelisted domain' },
    { url: 'http://api.github.com/users', expected: true, description: 'HTTP (not HTTPS) on whitelisted domain' },
    
    // Non-whitelisted domains (should fail)
    { url: 'https://evil.com/api', expected: false, description: 'Non-whitelisted domain' },
    { url: 'https://example.com/data', expected: false, description: 'Non-whitelisted domain' },
    { url: 'https://malicious-api.com', expected: false, description: 'Non-whitelisted domain' },
    
    // Localhost and private IPs (should fail - handled by existing security)
    // Note: Domain whitelist doesn't block these, but fetch operator does
    { url: 'http://localhost:3000', expected: false, description: 'Localhost' },
    { url: 'http://127.0.0.1:8080', expected: false, description: 'Loopback IP' },
    { url: 'http://10.0.0.1', expected: false, description: 'Private IP (10.x)' },
    { url: 'http://192.168.1.1', expected: false, description: 'Private IP (192.168.x)' },
    { url: 'http://172.16.0.1', expected: false, description: 'Private IP (172.16-31.x)' },
    
    // Invalid URLs (should fail)
    { url: 'not-a-url', expected: false, description: 'Invalid URL format' },
    { url: 'ftp://api.github.com', expected: false, description: 'Non-HTTP protocol' },
    { url: '', expected: false, description: 'Empty string' },
  ];

  console.log('Running Tests:\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((test, index) => {
    const result = whitelist.isAllowed(test.url);
    const status = result === test.expected ? '✓' : '✗';
    const statusText = result === test.expected ? 'PASS' : 'FAIL';

    console.log(`Test ${index + 1}: ${status} ${statusText}`);
    console.log(`  URL: ${test.url}`);
    console.log(`  Description: ${test.description}`);
    console.log(`  Expected: ${test.expected}, Got: ${result}`);

    if (result !== test.expected) {
      console.log(`  Error: ${whitelist.getErrorMessage(test.url)}`);
      failed++;
    } else {
      passed++;
    }

    console.log();
  });

  console.log('Summary:');
  console.log(`  Total: ${testCases.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log();

  if (failed === 0) {
    console.log('All tests passed! ✓');
  } else {
    console.log(`${failed} test(s) failed ✗`);
    process.exit(1);
  }
}

testDomainWhitelist();
