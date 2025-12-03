import { FetchOperator } from '../operators/fetch-operator';

async function testFetchOperator() {
  console.log('Testing Fetch Operator...\n');

  const operator = new FetchOperator();

  // Test 1: Validate valid URL
  console.log('Test 1: Validate valid URL');
  const validResult = operator.validate({ url: 'https://jsonplaceholder.typicode.com/posts/1' });
  console.log(`✓ Valid URL: ${validResult.valid}`);

  // Test 2: Validate missing URL
  console.log('\nTest 2: Validate missing URL');
  const missingResult = operator.validate({});
  console.log(`✓ Missing URL rejected: ${!missingResult.valid}`);
  console.log(`  Error: ${missingResult.error}`);

  // Test 3: Validate localhost URL
  console.log('\nTest 3: Validate localhost URL (should fail)');
  const localhostResult = operator.validate({ url: 'http://localhost:3000/api' });
  console.log(`✓ Localhost rejected: ${!localhostResult.valid}`);
  console.log(`  Error: ${localhostResult.error}`);

  // Test 4: Validate private IP
  console.log('\nTest 4: Validate private IP (should fail)');
  const privateIpResult = operator.validate({ url: 'http://192.168.1.1/api' });
  console.log(`✓ Private IP rejected: ${!privateIpResult.valid}`);
  console.log(`  Error: ${privateIpResult.error}`);

  // Test 5: Execute valid request
  console.log('\nTest 5: Execute valid request');
  try {
    const result = await operator.execute(null, { 
      url: 'https://jsonplaceholder.typicode.com/posts/1' 
    });
    console.log(`✓ Request successful`);
    console.log(`  Response:`, JSON.stringify(result, null, 2).substring(0, 200) + '...');
  } catch (error: any) {
    console.log(`✗ Request failed: ${error.message}`);
  }

  // Test 6: Execute invalid URL
  console.log('\nTest 6: Execute invalid URL (should fail)');
  try {
    await operator.execute(null, { url: 'http://localhost:3000/api' });
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly rejected: ${error.message}`);
  }

  // Test 7: Execute non-existent domain
  console.log('\nTest 7: Execute non-existent domain (should fail)');
  try {
    await operator.execute(null, { url: 'https://this-domain-does-not-exist-12345.com/api' });
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly failed: ${error.message}`);
  }

  console.log('\n✓ All tests completed!');
}

testFetchOperator().catch(console.error);
